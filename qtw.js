/*
*    QTW: qtw.js (c) 2011, 2012 50m30n3
*
*    This file is part of QTW.
*
*    QTW is free software: you can redistribute it and/or modify
*    it under the terms of the GNU General Public License as published by
*    the Free Software Foundation, either version 3 of the License, or
*    (at your option) any later version.
*
*    QTW is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.
*
*    You should have received a copy of the GNU General Public License
*    along with QTW.  If not, see <http://www.gnu.org/licenses/>.
*/

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

	var netbuffer;
	var databuffer;
	var framebuffer;
	var index;
	var imagedata;

	var seekoffset;

	var context;
	var buffer;

	var netxhr;
	var dataworker;
	var frameworker;

	this.onload = null;
	this.onbuffer = null;

	this.canvas = canvas;

	reset();

	function reset()
	{
		netbuffer = null;
		databuffer = null;
		framebuffer = null;
		index = null;
		imagedata = null;

		seekoffset = 0;

		qtw.filename = null;

		qtw.loaded = false;
		qtw.playable = false;

		qtw.netbuffering = false;
		qtw.databuffering = false;
		qtw.decoding = false;

		qtw.width = 0;
		qtw.height = 0;
		qtw.framerate = 0;
		qtw.numframes = 0;
		qtw.framenum = 0;
		qtw.numblocks = 0;
		qtw.netcache = 0;
		qtw.datacache = 0;
		qtw.framecache = 0;

		if( netxhr != null )
			netxhr.abort();

		if( dataworker != null )
			dataworker.terminate();
		
		if( frameworker != null )
			frameworker.terminate();
		
		netxhr = null;
		dataworker = null
		frameworker = null;

		context = null;
		buffer = null;
	}

	function headerCallback( event )
	{
		if( this.readyState == 4 )
		{
			if( this.status == 200 )
			{
				parseHeader( this.response );
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
				if( this.blocknum == qtw.netcache )
				{
					netbuffer.push( this.response );
					qtw.netcache++;

					qtw.netbuffering = false;

					qtw.buffer();
				}
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
		
		if( event.data.last )
			qtw.databuffering = false;

		qtw.buffer();
	}

	function frameCallback( event )
	{
		framebuffer.push( event.data );
		qtw.framecache++;
		
		qtw.decoding = false;
		
		qtw.playable = true;
		
		qtw.buffer();
	}

	function parseHeader( data )
	{
		var header = new DataView( data );

		if( header.getUint32( 0 ) != 0x51545731 )
			throw new qtwError( "Invalid header" );

		var version = header.getUint8( 4 );
		var width = header.getInt32( 5, true );
		var height = header.getInt32( 9, true );
		var framerate = header.getInt32( 13, true );
		var flags = header.getUint8( 17 );

		var has_index = flags & 0x01;
		
		if( ! has_index )
			throw new qtwError( "Cannot play back videos without index" );

		if( version != 7 )
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
		reset();

		context = qtw.canvas.getContext( "2d" );
		if( ! context )
			throw new qtwError( "Cannot get canvas context" );

		netxhr = new XMLHttpRequest();

		dataworker = new Worker( "dataworker.js" );
		dataworker.onmessage = dataCallback;

		frameworker = new Worker( "frameworker.js" );
		frameworker.onmessage = frameCallback;

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

		if( ( netbuffer.length < 16 ) && ( qtw.netcache < qtw.numblocks ) && ( ! this.netbuffering ) )
		{
			this.netbuffering = true;

			var num = this.netcache.toString();
			while( num.length < 6 )
				num = "0"+num;

			netxhr.open( "GET", this.filename+"."+num, true );
			netxhr.responseType = "arraybuffer";
			netxhr.onreadystatechange = netCallback;
			netxhr.blocknum = this.netcache;

			netxhr.send( null );
		}

		if( ( netbuffer.length >= 1 ) && ( databuffer.length < 256 ) && ( qtw.datacache < qtw.numframes ) && ( ! this.databuffering ) )
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
		
		this.onbuffer( this );
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

		this.netbuffering = false;
		this.databuffering = false;
		this.decoding = false;

		netxhr.abort();
		dataworker.terminate();
		frameworker.terminate();

		netxhr = new XMLHttpRequest();

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
			buffer.data.set( imagedata );
		}
		else
		{
			for( var i=0; i<this.width*this.height*4; i++ )
			{
				buffer.data[i] = imagedata[i];
			}
		}

		context.putImageData( buffer, ix, iy );
	}
}

