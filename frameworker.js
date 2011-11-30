"use strict";

importScripts( "dataview.js", "qtc.js", "databuffer.js", "transform.js" );

var width;
var height;
var refimage = null;
var image = null;
var outimage = null;
var offsets = [];

function listener( event )
{
	if( event.data.op == "decode" )
	{
		var cmddata = new DataBuffer( event.data.cmddata );
		var imgdata = new DataBuffer( event.data.imgdata );

		for( var i=0; i<height; i++ )
			offsets[i] = width;

/*		for( var i=3; i<width*height*4; i+=4 )
			outimage[i] = 0;*/

		if( event.data.keyframe )
		{
			qtcDecode( image, null, offsets, cmddata, imgdata, width, height, event.data.minsize, event.data.maxdepth );
		}
		else
		{
			qtcDecode( image, refimage, offsets, cmddata, imgdata, width, height, event.data.minsize, event.data.maxdepth );
		}

		refimage.set( image );

		if( event.data.transform == 1 )
			transformSimple( image, outimage, offsets, width, height );
		else if( event.data.transform == 2 )
			transformFull( image, outimage, offsets, width, height );

		self.postMessage( { imagedata:outimage, offsets:offsets } );
	}
	else if( event.data.op == "init" )
	{
		width = event.data.width;
		height = event.data.height;
		refimage = new Uint8Array( width*height*4 );
		image = new Uint8Array( width*height*4 );
		outimage = new Uint8Array( width*height*4 );
	}
}

this.onmessage = listener;

