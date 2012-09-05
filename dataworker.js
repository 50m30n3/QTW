/*
*    QTW: dataworker.js (c) 2011, 2012 50m30n3
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

importScripts( "dataview.js", "rangecode.js" );

function listener( event )
{
	var offset = event.data.offset;

	while( offset < event.data.indata.byteLength )
	{
		var header = new DataView( event.data.indata, offset, 9 );
		offset += 9;

		var flags = header.getUint8( 0 );
		var minsize = header.getInt32( 1, true );
		var maxdepth = header.getInt32( 5, true );

		var transform = flags & 0x03;
		var compression = ( flags & (0x01<<2) ) != 0;
		var colordiff = ( ( flags & (0x03<<3) ) >> 3 ) & 0x03;
		var caching = ( flags & (0x01<<5) ) != 0;
		var keyframe = ( flags & (0x01<<7) ) != 0;

		if ( keyframe )
		{
			cmdcoder.reset();
			imgcoder.reset();
			cachecoder.reset();
		}

		if( compression )
		{
			var cmdheader = new DataView( event.data.indata, offset, 8 );
			offset += 8;
			var cmdcompsize = cmdheader.getUint32( 0, true );
			var cmdsize = cmdheader.getUint32( 4, true );

			var cmdcompdata = new Uint8Array( event.data.indata, offset, cmdcompsize );
			offset += cmdcompsize;
	
			var cmddata = new Uint8Array( cmdsize )
			cmdcoder.decompress( cmdcompdata, cmddata );

			var dataheader = new DataView( event.data.indata, offset, 8 );
			offset += 8;
			var datacompsize = dataheader.getUint32( 0, true );
			var datasize = dataheader.getUint32( 4, true );

			var imgcompdata = new Uint8Array( event.data.indata, offset, datacompsize );
			offset += datacompsize;
	
			var imgdata = new Uint8Array( datasize );
			imgcoder.decompress( imgcompdata, imgdata );
			
			if( caching )
			{
				var cacheheader = new DataView( event.data.indata, offset, 8 );
				offset += 8;
				var cachecompsize = cacheheader.getUint32( 0, true );
				var cachesize = cacheheader.getUint32( 4, true );

				var cachecompdata = new Uint8Array( event.data.indata, offset, cachecompsize );
				offset += cachecompsize;
	
				var cachedata = new Uint8Array( cachesize );
				cachecoder.decompress( cachecompdata, cachedata );
			}
		}
		else
		{
			var cmdheader = new DataView( event.data.indata, offset, 4 );
			offset += 4;
			var cmdsize = cmdheader.getUint32( 0, true );
			cmddata = new Uint8Array( event.data.indata, offset, cmdsize );
			offset += cmdsize;

			var dataheader = new DataView( event.data.indata, offset, 4 );
			offset += 4;
			var datasize = dataheader.getUint32( 0, true );
			imgdata = new Uint8Array( event.data.indata, offset, datasize );
			offset += datasize;
			
			if( caching )
			{
				var cacheheader = new DataView( event.data.indata, offset, 4 );
				offset += 4;
				var cachesize = dataheader.getUint32( 0, true );
				cachedata = new Uint8Array( event.data.indata, offset, cachesize );
				offset += cachesize;
			}
		}
		
		var last = offset >= event.data.indata.byteLength;

		self.postMessage( { cmddata:cmddata, imgdata:imgdata, cachedata:cachedata, minsize:minsize, maxdepth:maxdepth, transform:transform, colordiff:colordiff, cache:caching, keyframe:keyframe, last:last } );
	}
}

var cmdcoder = new RangeCoder( 8, 1 );
var imgcoder = new RangeCoder( 2, 8 );
var cachecoder = new RangeCoder( 2, 8 );

this.onmessage = listener;

