"use strict";

function qtwError( message )
{
	this.name = "qtwError";
	this.message = message || "qtwError";
}
qtwError.prototype = new Error();
qtwError.prototype.constructor = qtwError;

function Qtw( canvas )
{
	var qtw = this;

	var netbuffer = null;
	var databuffer = null;
	var framebuffer = null;

	var data = null;
	var index = null;

	var seekoffset = 0;

	var imagedata = null;

	this.filename = null;

	this.onload = null;
	this.onbuffer = null;

	this.netbuffering = false;
	this.databuffering = false;
	this.decoding = false;

	this.loaded = false;
	this.playable = false;

	this.width = 0;
	this.height = 0;
	this.framerate = 0;
	this.numframes = 0;
	this.framenum = 0;
	this.numblocks = 0;
	this.netcache = 0;
	this.datacache = 0;
	this.framecache = 0;

	this.canvas = canvas;
	var context = null;
	var buffer = null;

	var netxhr = new XMLHttpRequest();
	var dataworker = null;
	var frameworker = null;

	function headerCallback( event )
	{
		if( this.readyState == 4 )
		{
			if( this.status == 200 )
			{
				data = this.response;
				parseHeader();
			}
			else
			{
				throw new qtwError( "Cannot open URL: " + this.status + " " + this.statusText );
			}
		}
	}

	function netCallback( event )
	{
		if( this.readyState == 4 )
		{
			if( this.status == 200 )
			{
				netbuffer.push( this.response );
				qtw.netcache++;

				qtw.onbuffer( qtw );

				qtw.netbuffering = false;

				qtw.buffer();
			}
			else
			{
				throw new qtwError( "Cannot open URL: " + this.status + " " + this.statusText );
			}
		}
	}

	function dataCallback( event )
	{
		databuffer.push( event.data );
		qtw.datacache++;
		
		qtw.onbuffer( qtw );

		if( event.data.last )
			qtw.databuffering = false;

		qtw.buffer();
	}

	function frameCallback( event )
	{
		framebuffer.push( event.data );
		qtw.framecache++;
		
		qtw.onbuffer( qtw );
		
		qtw.decoding = false;
		
		qtw.playable = true;
		
		qtw.buffer();
	}

	function parseHeader()
	{
		var header = new DataView( data );

		if( header.getUint32( 0 ) != 0x51545731 )
			throw new qtwError( "Invalid header" );

		var version = header.getUint8( 4 );
		var width = header.getInt32( 5, true );
		var height = header.getInt32( 9, true );
		var framerate = header.getInt32( 13, true );
		var flags = header.getUint8( 17 );

		if( version != 1 )
			throw new qtwError( "Invalid version" );
		
		qtw.width = width;
		qtw.height = height;
		qtw.framerate = framerate;

		var numframes = header.getInt32( 18, true );
		var numblocks = header.getInt32( 22, true );
		var index_size = header.getInt32( 26, true );
		
		qtw.numframes = numframes;
		qtw.numblocks = numblocks;

		index = [];
		for( var i=0; i<index_size; i++ )
		{
			index[i] = {};
			index[i].frame = header.getInt32( 30+16*i, true );
			index[i].block = header.getInt32( 30+16*i+4, true );
			index[i].offset = header.getInt32( 30+16*i+8, true );
		}

		context = qtw.canvas.getContext( "2d" );
		if( ! context )
			throw new qtwError( "Cannot get canvas context" );
		buffer = context.createImageData( width, height );

		netbuffer = [];
		databuffer = [];
		framebuffer = [];

		seekoffset = 0;

		frameworker.postMessage( { op:"init", width:qtw.width, height:qtw.height } );

		qtw.loaded = true;

		qtw.onload( qtw );
	}

	this.load = function( url )
	{
		netbuffer = null;
		databuffer = null;
		framebuffer = null;

		data = null;
		index = null;

		seekoffset = 0;

		imagedata = null;

		this.loaded = false;
		this.playable = false;

		this.netbuffering = false;
		this.databuffering = false;
		this.decoding = false;

		this.width = 0;
		this.height = 0;
		this.framerate = 0;
		this.numframes = 0;
		this.framenum = 0;
		this.numblocks = 0;
		this.netcache = 0;
		this.datacache = 0;
		this.framecache = 0;

		if( dataworker != null )
			dataworker.terminate();
		
		if( frameworker != null )
			frameworker.terminate();
		
		dataworker = new Worker( "dataworker.js" );
		dataworker.onmessage = dataCallback;

		frameworker = new Worker( "frameworker.js" );
		frameworker.onmessage = frameCallback;

		var context = null;
		var buffer = null;

		this.filename = url;

		netxhr.open( "GET", url, true );
		netxhr.responseType = "arraybuffer";
		netxhr.onreadystatechange = headerCallback;

		netxhr.send( null );
	}

	this.buffer = function()
	{
		if( ! this.loaded )
			throw new qtwError( "No video loaded" );

		if( ( netbuffer.length < 32 ) && ( qtw.netcache < qtw.numblocks ) && ( ! this.netbuffering ) )
		{
			this.netbuffering = true;

			var num = this.netcache.toString();
			while( num.length < 6 )
				num = "0"+num;

			netxhr.open( "GET", this.filename+"."+num, true );
			netxhr.responseType = "arraybuffer";
			netxhr.onreadystatechange = netCallback;

			netxhr.send( null );
		}

		if( ( netbuffer.length >= 1 ) && ( databuffer.length < 128 ) && ( qtw.datacache < qtw.numframes ) && ( ! this.databuffering ) )
		{
			this.databuffering = true;
			
			dataworker.postMessage( { indata:netbuffer.shift(), offset:seekoffset } );
			seekoffset = 0;
		}

		if( ( databuffer.length >= 1 ) && ( framebuffer.length < 32 ) && ( qtw.framecache < qtw.numframes ) && ( ! this.decoding ) )
		{
			this.decoding = true;
			
			var framedata = databuffer.shift();
			framedata.op = "decode";
			
			frameworker.postMessage( framedata );
		}
	}

	this.seek = function( frame )
	{
		var i;
		
		for( i=0; i<index.length; i++ )
		{
			if( index[i].frame > frame )
				break;
		}
		
		i--;
		
		this.framenum = index[i].frame;
		this.netcache = index[i].block;
		seekoffset = index[i].offset;
		
		this.datacache = this.framenum;
		this.framecache = this.framenum;

		if( dataworker != null )
			dataworker.terminate();
		
		if( frameworker != null )
			frameworker.terminate();

		this.netbuffering = false;
		this.databuffering = false;
		this.decoding = false;

		dataworker = new Worker( "dataworker.js" );
		dataworker.onmessage = dataCallback;

		frameworker = new Worker( "frameworker.js" );
		frameworker.onmessage = frameCallback;

		frameworker.postMessage( { op:"init", width:this.width, height:this.height } );

		netbuffer = [];
		databuffer = [];
		framebuffer = [];

		this.buffer();
	}

	this.nextFrame = function()
	{
		var hasFrame = false;

		if( ! this.loaded )
			throw new qtwError( "No video loaded" );
		
		if( ! this.playable )
			throw new qtwError( "Not ready to play" );

		if( framebuffer.length >= 1 )
		{
			imagedata = framebuffer.shift();
			this.framenum++;
			hasFrame = true;
		}
		else
		{
			hasFrame = false;
			if( databuffer.length < 1 )
				this.playable = false;
		}

		if( this.framenum >= this.numframes )
			this.playable = false;
		else
			this.buffer();
		
		return hasFrame;
	}

	this.display = function( x, y )
	{
		if( imagedata == null )
			throw new qtwError( "No decoded image" );

		var ix = x || 0;
		var iy = y || 0;

		if( buffer.data.set )
		{
			buffer.data.set( imagedata.imagedata );
		}
		else
		{
			var i;
			for( var py=0; py<this.height; py++ )
			{
				i = (py*this.width+imagedata.offsets[py])*4;
				for( var px=imagedata.offsets[py]; px<this.width; px++ )
				{
					buffer.data[i] = imagedata.imagedata[i];
					buffer.data[i+1] = imagedata.imagedata[i+1];
					buffer.data[i+2] = imagedata.imagedata[i+2];
					buffer.data[i+3] = imagedata.imagedata[i+3];
					i += 4;
				}
			}
		}
		
		context.putImageData( buffer, ix, iy );
	}
}

