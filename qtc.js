/*
*    QTW: qtc.js (c) 2011, 2012 50m30n3
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

function qtcDecode( image, refimage, minx, maxx, commanddata, imagedata, width, height, minsize, maxdepth )
{
	if( refimage )
		image.set( refimage );

	function decompress_rec( x1, y1, x2, y2, depth )
	{
		if( refimage != null )
			var status = commanddata.getBit();
		else
			status = 1;

		if( status == 1 )
		{
			if( commanddata.getBit() == 0 )
			{
				if( depth < maxdepth )
				{
					if( ( x2-x1 > minsize ) && ( y2-y1 > minsize ) )
					{
						var sx = x1 + Math.floor((x2-x1)/2);
						var sy = y1 + Math.floor((y2-y1)/2);

						decompress_rec( x1, y1, sx, sy, depth+1 );
						decompress_rec( x1, sy, sx, y2, depth+1 );
						decompress_rec( sx, y1, x2, sy, depth+1 );
						decompress_rec( sx, sy, x2, y2, depth+1 );
					}
					else
					{
						if( x2-x1 > minsize )
						{
							var sx = x1 + Math.floor((x2-x1)/2);

							decompress_rec( x1, y1, sx, y2, depth+1 );
							decompress_rec( sx, y1, x2, y2, depth+1 );
						}
						else if ( y2-y1 > minsize )
						{
							var sy = y1 + Math.floor((y2-y1)/2);

							decompress_rec( x1, y1, x2, sy, depth+1 );
							decompress_rec( x1, sy, x2, y2, depth+1 );
						}
						else
						{
							for( var y=y1; y<y2; y++ )
							{
								if( minx[y] > x1 )
									minx[y] = x1;

								if( maxx[y] < x2 )
									maxx[y] = x2;

								var i = (x1+y*width)*4;
								for( var x=x1; x<x2; x++ )
								{
									image[ i++ ] = imagedata.getByte();
									image[ i++ ] = imagedata.getByte();
									image[ i++ ] = imagedata.getByte();
									i++;
								}
							}
						}
					}
				}
				else
				{
					for( var y=y1; y<y2; y++ )
					{
						if( minx[y] > x1 )
							minx[y] = x1;

						if( maxx[y] < x2 )
							maxx[y] = x2;

						var i = (x1+y*width)*4;
						for( var x=x1; x<x2; x++ )
						{
							image[ i++ ] = imagedata.getByte();
							image[ i++ ] = imagedata.getByte();
							image[ i++ ] = imagedata.getByte();
							i++;
						}
					}
				}
			}
			else
			{
				var r = imagedata.getByte();
				var g = imagedata.getByte();
				var b = imagedata.getByte();

				for( var y=y1; y<y2; y++ )
				{
					if( minx[y] > x1 )
						minx[y] = x1;

					if( maxx[y] < x2 )
						maxx[y] = x2;

					var i = (x1+y*width)*4;
					for( var x=x1; x<x2; x++ )
					{
						image[ i++ ] = r;
						image[ i++ ] = g;
						image[ i++ ] = b;
						i++;
					}
				}
			}
		}
	}
	
	decompress_rec( 0, 0, width, height, 0 );
}

function qtcDecodeColorDiff( image, refimage, minx, maxx, commanddata, imagedata, width, height, minsize, maxdepth )
{
	if( refimage )
		image.set( refimage );

	function decompress_rec_luma( x1, y1, x2, y2, depth )
	{
		if( refimage != null )
			var status = commanddata.getBit();
		else
			status = 1;

		if( status == 1 )
		{
			if( commanddata.getBit() == 0 )
			{
				if( depth < maxdepth )
				{
					if( ( x2-x1 > minsize ) && ( y2-y1 > minsize ) )
					{
						var sx = x1 + Math.floor((x2-x1)/2);
						var sy = y1 + Math.floor((y2-y1)/2);

						decompress_rec_luma( x1, y1, sx, sy, depth+1 );
						decompress_rec_luma( x1, sy, sx, y2, depth+1 );
						decompress_rec_luma( sx, y1, x2, sy, depth+1 );
						decompress_rec_luma( sx, sy, x2, y2, depth+1 );
					}
					else
					{
						if( x2-x1 > minsize )
						{
							var sx = x1 + Math.floor((x2-x1)/2);

							decompress_rec_luma( x1, y1, sx, y2, depth+1 );
							decompress_rec_luma( sx, y1, x2, y2, depth+1 );
						}
						else if ( y2-y1 > minsize )
						{
							var sy = y1 + Math.floor((y2-y1)/2);

							decompress_rec_luma( x1, y1, x2, sy, depth+1 );
							decompress_rec_luma( x1, sy, x2, y2, depth+1 );
						}
						else
						{
							for( var y=y1; y<y2; y++ )
							{
								if( minx[y] > x1 )
									minx[y] = x1;

								if( maxx[y] < x2 )
									maxx[y] = x2;

								var i = (x1+y*width)*4;
								for( var x=x1; x<x2; x++ )
								{
									i++;
									image[ i++ ] = imagedata.getByte();
									i += 2;
								}
							}
						}
					}
				}
				else
				{
					for( var y=y1; y<y2; y++ )
					{
						if( minx[y] > x1 )
							minx[y] = x1;

						if( maxx[y] < x2 )
							maxx[y] = x2;

						var i = (x1+y*width)*4;
						for( var x=x1; x<x2; x++ )
						{
							i++;
							image[ i++ ] = imagedata.getByte();
							i += 2;
						}
					}
				}
			}
			else
			{
				var g = imagedata.getByte();

				for( var y=y1; y<y2; y++ )
				{
					if( minx[y] > x1 )
						minx[y] = x1;

					if( maxx[y] < x2 )
						maxx[y] = x2;

					var i = (x1+y*width)*4;
					for( var x=x1; x<x2; x++ )
					{
						i++;
						image[ i++ ] = g;
						i += 2;
					}
				}
			}
		}
	}

	function decompress_rec_chroma( x1, y1, x2, y2, depth )
	{
		if( refimage != null )
			var status = commanddata.getBit();
		else
			status = 1;

		if( status == 1 )
		{
			if( commanddata.getBit() == 0 )
			{
				if( depth < maxdepth )
				{
					if( ( x2-x1 > minsize ) && ( y2-y1 > minsize ) )
					{
						var sx = x1 + Math.floor((x2-x1)/2);
						var sy = y1 + Math.floor((y2-y1)/2);

						decompress_rec_chroma( x1, y1, sx, sy, depth+1 );
						decompress_rec_chroma( x1, sy, sx, y2, depth+1 );
						decompress_rec_chroma( sx, y1, x2, sy, depth+1 );
						decompress_rec_chroma( sx, sy, x2, y2, depth+1 );
					}
					else
					{
						if( x2-x1 > minsize )
						{
							var sx = x1 + Math.floor((x2-x1)/2);

							decompress_rec_chroma( x1, y1, sx, y2, depth+1 );
							decompress_rec_chroma( sx, y1, x2, y2, depth+1 );
						}
						else if ( y2-y1 > minsize )
						{
							var sy = y1 + Math.floor((y2-y1)/2);

							decompress_rec_chroma( x1, y1, x2, sy, depth+1 );
							decompress_rec_chroma( x1, sy, x2, y2, depth+1 );
						}
						else
						{
							for( var y=y1; y<y2; y++ )
							{
								if( minx[y] > x1 )
									minx[y] = x1;

								if( maxx[y] < x2 )
									maxx[y] = x2;

								var i = (x1+y*width)*4;
								for( var x=x1; x<x2; x++ )
								{
									image[ i++ ] = imagedata.getByte();
									i++;
									image[ i++ ] = imagedata.getByte();
									i++;
								}
							}
						}
					}
				}
				else
				{
					for( var y=y1; y<y2; y++ )
					{
						if( minx[y] > x1 )
							minx[y] = x1;

						if( maxx[y] < x2 )
							maxx[y] = x2;

						var i = (x1+y*width)*4;
						for( var x=x1; x<x2; x++ )
						{
							image[ i++ ] = imagedata.getByte();
							i++;
							image[ i++ ] = imagedata.getByte();
							i++;
						}
					}
				}
			}
			else
			{
				var r = imagedata.getByte();
				var b = imagedata.getByte();

				for( var y=y1; y<y2; y++ )
				{
					if( minx[y] > x1 )
						minx[y] = x1;

					if( maxx[y] < x2 )
						maxx[y] = x2;

					var i = (x1+y*width)*4;
					for( var x=x1; x<x2; x++ )
					{
						image[ i++ ] = r;
						i++;
						image[ i++ ] = b;
						i++;
					}
				}
			}
		}
	}

	decompress_rec_luma( 0, 0, width, height, 0 );
	decompress_rec_chroma( 0, 0, width, height, 0 );
}


