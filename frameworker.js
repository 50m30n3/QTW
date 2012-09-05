/*
*    QTW: frameworker.js (c) 2011, 2012 50m30n3
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

importScripts( "dataview.js", "qtc.js", "databuffer.js", "transform.js" );

var width;
var height;

var refimage = null;
var image = null;
var transimage = null;
var diffimage = null;

var cache = { index:0, size:0, tilesize:0, idxsize:0, data:null };

var minx = [];
var maxx = [];

function listener( event )
{
	if( event.data.op == "decode" )
	{
		var cmddata = new DataBuffer( event.data.cmddata );
		var imgdata = new DataBuffer( event.data.imgdata );
		if( event.data.cache )
			var cachedata = new DataBuffer( event.data.cachedata );
		else
			var cachedata = null;

		for( var i=0; i<height; i++ )
		{
			minx[i] = width;
			maxx[i] = 0;
		}

		if( event.data.keyframe )
		{
			cache.index = 0;

			if( event.data.colordiff >= 2 )
				qtcDecodeColorDiff( image, null, minx, maxx, cmddata, imgdata, cachedata, cache, width, height, event.data.minsize, event.data.maxdepth );
			else
				qtcDecode( image, null, minx, maxx, cmddata, imgdata, cachedata, cache, width, height, event.data.minsize, event.data.maxdepth );
		}
		else
		{
			if( event.data.colordiff >= 2 )
				qtcDecodeColorDiff( image, refimage, minx, maxx, cmddata, imgdata, cachedata, cache, width, height, event.data.minsize, event.data.maxdepth );
			else
				qtcDecode( image, refimage, minx, maxx, cmddata, imgdata, cachedata, cache, width, height, event.data.minsize, event.data.maxdepth );
		}

		refimage.set( image );

		if( event.data.transform == 1 )
			transformSimple( image, transimage, minx, maxx, width, height );
		else if( event.data.transform == 2 )
			transformFull( image, transimage, minx, maxx, width, height );
		else
			transimage.set( image );

		if( event.data.colordiff > 0 )
		{
			colorDiff( transimage, diffimage, minx, maxx, width, height );
			self.postMessage( diffimage );
		}
		else
		{
			self.postMessage( transimage );
		}
	}
	else if( event.data.op == "init" )
	{
		width = event.data.width;
		height = event.data.height;

		if( event.data.cachesize )
		{
			cache.size = event.data.cachesize;
			cache.tilesize = event.data.tilesize*event.data.tilesize*3;
			cache.index = 0;
			cache.data = new Uint8Array( cache.tilesize*event.data.cachesize );
			
			if( cache.size <= 0x1<<16 )
				cache.idxsize = 2;
			else if( cache.size <= 0x1<<24 )
				cache.idxsize = 3;
			else
				cache.idxsize = 4;
		}

		refimage = new Uint8Array( width*height*4 );
		image = new Uint8Array( width*height*4 );
		transimage = new Uint8Array( width*height*4 );
		diffimage = new Uint8Array( width*height*4 );

		for( var i=3; i<width*height*4; i+=4 )
		{
			image[i] = 255;
			transimage[i] = 255;
			diffimage[i] = 255;
		}
	}
}

this.onmessage = listener;

