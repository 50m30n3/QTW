/*
*    QTW: transform.js (c) 2011, 2012 50m30n3
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

function colorDiff( pixels, outpixels, minx, maxx, width, height )
{
	var stride = width*4;
	var i, x1, x2;

	for( var y=0; y<height; y++ )
	{
		x1 = minx[y];
		x2 = maxx[y];

		if( x1 < x2 )
		{
			i = stride * y + x1*4;
			for( var x=x1; x<x2; x++ )
			{
				outpixels[i] = pixels[i] + pixels[i+1];
				outpixels[i+1] = pixels[i+1];
				outpixels[i+2] = pixels[i+2] + pixels[i+1];
				i += 4;
			}
		}
	}
}

function transformSimple( pixels, outpixels, minx, maxx, width, height )
{
	var stride = width*4;

	var i = 0;

	for( var x=1; x<width; x++ )
	{
		var par = pixels[ i+0 ];
		var pag = pixels[ i+1 ];
		var pab = pixels[ i+2 ];

		i += 4;

		pixels[ i+0 ] += par;
		pixels[ i+1 ] += pag;
		pixels[ i+2 ] += pab;
	}

	i = stride;

	for( var y=1; y<height; y++ )
	{
		var pbr = pixels[ i-stride+0 ];
		var pbg = pixels[ i-stride+1 ];
		var pbb = pixels[ i-stride+2 ];

		pixels[ i+0 ] += pbr;
		pixels[ i+1 ] += pbg;
		pixels[ i+2 ] += pbb;
		
		i += 4;

		for( var x=1; x<width; x++ )
		{
			var ia = i-4;
			var par = pixels[ ia+0 ];
			var pag = pixels[ ia+1 ];
			var pab = pixels[ ia+2 ];

			var ib = i-stride;
			var pbr = pixels[ ib+0 ];
			var pbg = pixels[ ib+1 ];
			var pbb = pixels[ ib+2 ];
			
			var ic = i-4-stride;
			var pcr = pixels[ ic+0 ];
			var pcg = pixels[ ic+1 ];
			var pcb = pixels[ ic+2 ];

			pixels[ i+0 ] += par + pbr - pcr;
			pixels[ i+1 ] += pag + pbg - pcg;
			pixels[ i+2 ] += pab + pbb - pcb;
			
			i += 4;
		}
	}
}

function transformFull( pixels, outpixels, minx, maxx, width, height )
{
	var stride = width*4;
	var change = false;

	var i = 0;
	var x1 = minx[0];
	var x2 = maxx[0];

	if( x1 == 0 )
	{
		var opr = outpixels[ i ];
		var opg = outpixels[ i+1 ];
		var opb = outpixels[ i+2 ];

		outpixels[ i ] = pixels[ i ];
		outpixels[ i+1 ] = pixels[ i+1 ];
		outpixels[ i+2 ] = pixels[ i+2 ];

		if( ( outpixels[ i ] != opr ) || ( outpixels[ i+1 ] != opg ) || ( outpixels[ i+2 ] != opb ) )
		{
			minx[0] = 0;
			change = true;
		}

		x1++;
	}

	i = x1*4;

	for( var x=x1; x<width; x++ )
	{
		var opr = outpixels[ i ];
		var opg = outpixels[ i+1 ];
		var opb = outpixels[ i+2 ];

		outpixels[ i ] = outpixels[ i-4 ] + pixels[ i ];
		outpixels[ i+1 ] = outpixels[ i-4+1 ] + pixels[ i+1 ];
		outpixels[ i+2 ] = outpixels[ i-4+2 ] + pixels[ i+2 ];

		if( ( outpixels[ i ] != opr ) || ( outpixels[ i+1 ] != opg ) || ( outpixels[ i+2 ] != opb ) )
		{
			if( ! change )
			{
				minx[0] = x;
				change = true;
				
				maxx[0] = 1;
			}

			maxx[0] = x+1;
		}
		else if( x > x2 )
		{
			break;
		}

		i += 4;
	}

	for( var y=1; y<height; y++ )
	{
		if( minx[y] > minx[y-1] )
			x1 = minx[y-1];
		else
			x1 = minx[y];

		if( maxx[y] < maxx[y-1] )
			x2 = maxx[y-1];
		else
			x2 = maxx[y];

		if( x2 <= x1 )
			continue;

		i = stride * y;

		change = false;

		if( x1 == 0 )
		{
			var opr = outpixels[ i ];
			var opg = outpixels[ i+1 ];
			var opb = outpixels[ i+2 ];

			outpixels[ i ] = outpixels[ i-stride ] + pixels[ i ];
			outpixels[ i+1 ] = outpixels[ i-stride+1 ] + pixels[ i+1 ];
			outpixels[ i+2 ] = outpixels[ i-stride+2 ] + pixels[ i+2 ];
			
			if( ( outpixels[ i ] != opr ) || ( outpixels[ i+1 ] != opg ) || ( outpixels[ i+2 ] != opb ) )
			{
				minx[y] = 0;
				change = true;
				
				maxx[y] = 1;
			}

			x1++;
		}

		i += x1*4;

		for( var x=x1; x<width; x++ )
		{
			var ia = i-4;
			var par = outpixels[ ia+0 ];
			var pag = outpixels[ ia+1 ];
			var pab = outpixels[ ia+2 ];

			var ib = i-stride;
			var pbr = outpixels[ ib+0 ];
			var pbg = outpixels[ ib+1 ];
			var pbb = outpixels[ ib+2 ];
			
			var ic = i-4-stride;
			var pcr = outpixels[ ic+0 ];
			var pcg = outpixels[ ic+1 ];
			var pcb = outpixels[ ic+2 ];

			var pr = par + pbr - pcr;
			var pg = pag + pbg - pcg;
			var pb = pab + pbb - pcb;
			
			var aerr = Math.abs( par - pr );
			aerr += Math.abs( pag - pg );
			aerr += Math.abs( pab - pb );
			
			var berr = Math.abs( pbr - pr );
			berr += Math.abs( pbg - pg );
			berr += Math.abs( pbb - pb );
			
			var cerr = Math.abs( pcr - pr );
			cerr += Math.abs( pcg - pg );
			cerr += Math.abs( pcb - pb );

			var opr = outpixels[ i ];
			var opg = outpixels[ i+1 ];
			var opb = outpixels[ i+2 ];

			if( ( aerr < berr ) && ( aerr < cerr ) )
			{
				outpixels[ i ] = pixels[ i ] + par;
				outpixels[ i+1 ] = pixels[ i+1 ] + pag;
				outpixels[ i+2 ] = pixels[ i+2 ] + pab;
			}
			else if( berr < cerr )
			{
				outpixels[ i ] = pixels[ i ] + pbr;
				outpixels[ i+1 ] = pixels[ i+1 ] + pbg;
				outpixels[ i+2 ] = pixels[ i+2 ] + pbb;
			}
			else
			{
				outpixels[ i ] = pixels[ i ] + pcr;
				outpixels[ i+1 ] = pixels[ i+1 ] + pcg;
				outpixels[ i+2 ] = pixels[ i+2 ] + pcb;
			}

			if( ( outpixels[ i ] != opr ) || ( outpixels[ i+1 ] != opg ) || ( outpixels[ i+2 ] != opb ) )
			{
				if( ! change )
				{
					minx[y] = x;
					change = true;
				}

				maxx[y] = x+1;
			}
			else if( x > x2 )
			{
				break;
			}

			i+=4;
		}
	}
}

