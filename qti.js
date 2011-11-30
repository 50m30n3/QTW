"use strict";

function qtiError( message )
{
	this.name = "qtiError";
	this.message = message || "qtiError";
}
qtiError.prototype = new Error();
qtiError.prototype.constructor = qtiError;

function Qti()
{
	var qti = this;

	var data = null;
	var pixels = null;

	this.onload = null;
	this.ondecode = null;

	var minsize = 0;
	var maxdepth = 0;
	var transform = 0;

	this.width = 0;
	this.height = 0;

	var cmddata = null;
	var imgdata = null;

	var cmdcoder = new Worker( "dataworker.js" );
	cmdcoder.onmessage = dataCallback;
	cmdcoder.postMessage( { op:"init", order:0 } );
	
	var datacoder = new Worker( "dataworker.js" );
	datacoder.onmessage = dataCallback;
	datacoder.postMessage( { op:"init", order:1 } );

	var imagecoder = new Worker( "imageworker.js" );
	imagecoder.onmessage = imageCallback;

	function netCallback( event )
	{
		if( this.readyState == 4 )
		{
			if( this.status == 200 )
			{
				data = this.response;
				qti.onload( qti );
			}
			else
			{
				throw new qtiError( "Cannot open URL: " + this.status + " " + this.statusText );
			}
		}
	}

	function dataCallback( event )
	{
		if( event.data.op == "decompress" )
		{
			if( event.data.tag == "cmd" )
			{
				cmddata = event.data.outdata;
			}
			else if( event.data.tag == "img" )
			{
				imgdata = event.data.outdata;
			}
			
			if( ( imgdata != null ) && ( cmddata != null ) )
			{
				decodeImage();
			}
		}
	}

	function imageCallback( event )
	{
		if( event.data.op == "decompress" )
		{
			pixels = event.data.pixels;
			qti.ondecode( qti );
		}
	}

	function parseImage( )
	{
		var header = new DataView( data, 0, 22 );

		if( header.getUint32( 0 ) != 0x51544931 )
			throw new qtiError( "Invalid header" );

		var version = header.getUint8( 4 );
		var width = header.getInt32( 5, true );
		var height = header.getInt32( 9, true );
		var flags = header.getUint8( 13 );
		minsize = header.getInt32( 14, true );
		maxdepth = header.getInt32( 18, true );

		transform = flags & 0x03;
		var compression = ( flags & (0x01<<2) ) != 0;

		if( version != 2 )
			throw new qtiError( "Invalid version" );
		
		qti.width = width;
		qti.height = height;

		if( compression )
		{
			cmddata = null;
			imgdata = null;

			var cmdheader = new DataView( data, 22, 8 );
			var cmdcompsize = cmdheader.getUint32( 0, true );
			var cmdsize = cmdheader.getUint32( 4, true );

			var cmdcompdata = new Uint8Array( data, 30, cmdcompsize );
			
			cmdcoder.postMessage( { op:"reset" } );
			cmdcoder.postMessage( { op:"decompress", indata:cmdcompdata, size:cmdsize, tag:"cmd" } );

			var dataheader = new DataView( data, 30+cmdcompsize, 8 );
			var datacompsize = dataheader.getUint32( 0, true );
			var datasize = dataheader.getUint32( 4, true );

			var imgcompdata = new Uint8Array( data, 38+cmdcompsize, datacompsize );
			
			datacoder.postMessage( { op:"reset" } );
			datacoder.postMessage( { op:"decompress", indata:imgcompdata, size:datasize, tag:"img" } );
		}
		else
		{
			var cmdheader = new DataView( data, 22, 4 );
			var cmdsize = cmdheader.getUint32( 0, true );
			cmddata = new Uint8Array( data, 26, cmdsize );

			var dataheader = new DataView( data, 26+cmdsize, 4 );
			var datasize = dataheader.getUint32( 0, true );
			imgdata = new Uint8Array( data, 30+cmdsize, datasize );
			
			decodeImage();
		}	
	}

	function decodeImage()
	{
		imagecoder.postMessage( { op:"init", width:qti.width, height:qti.height } );
		imagecoder.postMessage( { op:"decompress", cmddata:cmddata, imgdata:imgdata, transform:transform, minsize:minsize, maxdepth:maxdepth } );
	}

	this.load = function( url )
	{
		var xhr = new XMLHttpRequest();
		xhr.open( "GET", url, true );
		xhr.responseType = "arraybuffer";
		xhr.onreadystatechange = netCallback;

		xhr.send( null );
	}

	this.decode = function()
	{
		if( data == null )
			throw new qtiError( "No image loaded" );
		
		parseImage();
	}
	
	this.display = function( canvas, x, y, resize )
	{
		if( pixels == null )
			throw new qtiError( "No decoded image" );

		if( resize )
		{
			canvas.width = this.width;
			canvas.height = this.height;
		}

		x = x || 0;
		y = y || 0;

		var context = canvas.getContext( "2d" );
		var buffer = context.createImageData( this.width, this.height )

		for( var i=0; i<this.width*this.height*4; i++ )
			buffer.data[i] = pixels[i];
		
		context.putImageData( buffer, x, y );
	}
}

