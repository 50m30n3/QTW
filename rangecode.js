/*
*    QTW: rangecode.js (c) 2011, 2012 50m30n3
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

function RangeCoder( order, bits )
{
	this.order = order;
	this.bits = bits;

	this.numsymbols = 1<<bits;

	this.freq = [];
	this.totals = [];

	this.reset = function()
	{
		var fsize = 1<<(bits*(order+1));
		var tsize = 1<<(bits*order);

		for( var i=0; i<fsize; i++ )
			this.freq[i] = 1;

		for( var i=0; i<tsize; i++ )
			this.totals[i] = this.numsymbols;
	}

	this.reset();

	this.decompress = function( inbuffer, outbuffer )
	{
		var low = 0x00;
		var range = rcMaxrange;
		var code = 0x00;

		var total, start, size, value, symbol;

		var freq = this.freq;
		var totals = this.totals;
		var bits = this.bits;
		var order = this.order;
		var numsymbols = this.numsymbols;
		
		var data;
		var buffer = 0x00;
		var bufferbits = 0;

		for( var i=0; i<4; i++ )
		{
			code = ( code*256 ) % (rcMaxrange+1);
			code += inbuffer[i];
		}

		var inpos = 4;
		var outpos = 0;

		var mask = 0xffffffff>>>(32-(bits*(order+1)));
		var idx = 0x00;
		var tidx = 0x00;

		for( var count=0; count<outbuffer.byteLength*8; count+=bits )
		{
			total = totals[tidx];

			range = Math.floor( range / total );

			value = ( code - low ) / range;
		
			i = 0;
			start = 0;
			while( ( value >= start ) && ( i < numsymbols ) )
			{
				start += freq[idx+i];
				i++;
			}

			if( value >= start )
				throw new rcError( "Decompression Error" );

			symbol = i-1;
			
			if( bits == 8 )
			{
				outbuffer[outpos++] = symbol;
			}
			else
			{
				data = symbol;

				for( var i=0; i<bits; i++ )
				{
					buffer |= (data&0x01)<<bufferbits++;
					data >>>= 1;
					
					if( bufferbits >= 8 )
					{
						outbuffer[outpos++] = buffer;
						buffer = 0x00;
						bufferbits = 0;
					}
				}
			}

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
			totals[tidx] += 32;

			if( totals[tidx] >= 0xFFFF )
			{
				totals[tidx] = 0;
				for( var i=0; i<numsymbols; i++ )
				{
					freq[idx+i] >>>= 1;
					if( freq[idx+i] == 0 )
						freq[idx+i] = 1;
					totals[tidx] += freq[idx+i];
				}
			}

			idx = ((idx+symbol)<<bits)&mask;
			tidx = idx>>>bits;
		}
	}
}

