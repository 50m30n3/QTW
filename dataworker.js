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
		var keyframe = ( flags & (0x01<<7) ) != 0;

		if ( keyframe )
		{
			cmdcoder.reset();
			imgcoder.reset();
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
		}
		
		var last = offset >= event.data.indata.byteLength;

		self.postMessage( { cmddata:cmddata, imgdata:imgdata, minsize:minsize, maxdepth:maxdepth, transform:transform, colordiff:colordiff, keyframe:keyframe, last:last } );
	}
}

var cmdcoder = new RangeCoder( 8, 1 );
var imgcoder = new RangeCoder( 2, 8 );

this.onmessage = listener;

