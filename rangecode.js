"use strict";

function rcError( message )
{
	this.name = "rcError";
	this.message = message || "rcError";
}
rcError.prototype = new Error();
rcError.prototype.constructor = rcError;

var rcMaxrange = 0xFFFFFFFF;
var rcTop = 0x01<<24;
var rcBottom = 0x01<<16;

function RangeCoder( order )
{
	this.order = order;

	this.freq = [];
	this.totals = [];
	
	for( var i=0; i<256; i++ )
	{
		for( var j=0; j<256; j++ )
			this.freq[i*256+j] = 1;
	
		this.totals[i] = 256;
	}

	this.reset = function()
	{
		for( var i=0; i<256; i++ )
		{
			for( var j=0; j<256; j++ )
				this.freq[i*256+j] = 1;
	
			this.totals[i] = 256;
		}
	}

	this.decompress = function( inbuffer, outbuffer )
	{
		var low = 0x00;
		var range = rcMaxrange;
		var code = 0x00;

		var total, start, size, value, symbol;

		var freq = this.freq;
		var totals = this.totals;

		for( var i=0; i<4; i++ )
		{
			code = ( code*256 ) % (rcMaxrange+1);
			code += inbuffer[i];
		}

		var inpos = 4;

		var lastsym = 0x00;
		var idx = 0x00;

		for( var count=0; count<outbuffer.byteLength; count++ )
		{
			total = totals[lastsym];

			range = Math.floor( range / total );

			value = ( code - low ) / range;
		
			i = 0;
			start = 0;
			while( ( value >= start ) && ( i < 256 ) )
			{
				start += freq[idx+i];
				i++;
			}

			if( value >= start )
				throw new rcError( "Decompression Error" );

			symbol = i-1;
			outbuffer[count] = symbol;

			size = freq[idx+symbol];
			start -= size;

			low += start * range;
			range *= size;

			while( ( (low>>>24) == ((low+range)>>>24) ) || ( range < rcBottom ) )
			{
				if( ( range < rcBottom ) && ( (low>>>24) != ((low+range)>>>24) ) )
					range = (((low%rcBottom)^0xFFFF)+1)%rcBottom;

				code = ( code*256 ) % (rcMaxrange+1);
				code += inbuffer[inpos++];

				low = ( low*256 ) % (rcMaxrange+1);
				range = ( range*256 ) % (rcMaxrange+1);
			}

			freq[idx+symbol] += 32;
			totals[lastsym] += 32;

			if( totals[lastsym] >= 0xFFFF )
			{
				totals[lastsym] = 0;
				for( i=0; i<256; i++ )
				{
					freq[idx+i] = Math.floor( freq[idx+i] / 2 );
					if( freq[idx+i] == 0 )
						freq[idx+i] = 1;
					totals[lastsym] += freq[idx+i];
				}
			}

			if( this.order > 0 )
			{
				lastsym = symbol;
				idx = symbol*256;
			}
		}
	}
}

