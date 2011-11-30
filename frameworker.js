"use strict";

importScripts( "dataview.js", "qtc.js", "databuffer.js", "transform.js" );

var width;
var height;
var refimage = null;
var image = null;

function listener( event )
{
	if( event.data.op == "decode" )
	{
		var cmddata = new DataBuffer( event.data.cmddata );
		var imgdata = new DataBuffer( event.data.imgdata );

		if( event.data.keyframe )
		{
			qtcDecode( image, null, cmddata, imgdata, width, height, event.data.minsize, event.data.maxdepth );
		}
		else
		{
			image.set( refimage );
			qtcDecode( image, refimage, cmddata, imgdata, width, height, event.data.minsize, event.data.maxdepth );
		}

		refimage.set( image );

		if( event.data.transform == 1 )
			transformSimple( image, width, height );
		else if( event.data.transform == 2 )
			transformFull( image, width, height );

		self.postMessage( image );
	}
	else if( event.data.op == "init" )
	{
		width = event.data.width;
		height = event.data.height;
		refimage = new Uint8Array( width*height*4 );
		image = new Uint8Array( width*height*4 );
	}
}

this.onmessage = listener;

