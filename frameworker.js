"use strict";

importScripts( "dataview.js", "qtc.js", "databuffer.js", "transform.js" );

var width;
var height;
var refimage = null;
var image = null;
var transimage = null;
var diffimage = null;
var minx = [];
var maxx = [];

function listener( event )
{
	if( event.data.op == "decode" )
	{
		var cmddata = new DataBuffer( event.data.cmddata );
		var imgdata = new DataBuffer( event.data.imgdata );

		for( var i=0; i<height; i++ )
		{
			minx[i] = width;
			maxx[i] = 0;
		}

		if( event.data.keyframe )
		{
			if( event.data.colordiff >= 2 )
				qtcDecodeColorDiff( image, null, minx, maxx, cmddata, imgdata, width, height, event.data.minsize, event.data.maxdepth );
			else
				qtcDecode( image, null, minx, maxx, cmddata, imgdata, width, height, event.data.minsize, event.data.maxdepth );
		}
		else
		{
			if( event.data.colordiff >= 2 )
				qtcDecodeColorDiff( image, refimage, minx, maxx, cmddata, imgdata, width, height, event.data.minsize, event.data.maxdepth );
			else
				qtcDecode( image, refimage, minx, maxx, cmddata, imgdata, width, height, event.data.minsize, event.data.maxdepth );
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
		refimage = new Uint8Array( width*height*4 );
		image = new Uint8Array( width*height*4 );
		transimage = new Uint8Array( width*height*4 );
		diffimage = new Uint8Array( width*height*4 );

		for( var i=3; i<width*height*4; i+=4 )
		{
			transimage[i] = 255;
			diffimage[i] = 255;
		}
	}
}

this.onmessage = listener;

