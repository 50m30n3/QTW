"use strict";

function transformSimple( pixels, width, height )
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

function transformFull( pixels, width, height )
{
	var stride = width*4;

	var i = 0;

	for( var x=1; x<width; x++ )
	{
		var par = pixels[ i++ ];
		var pag = pixels[ i++ ];
		var pab = pixels[ i++ ];

		i++;

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

		pixels[ i++ ] += pbr;
		pixels[ i++ ] += pbg;
		pixels[ i++ ] += pbb;
		
		i++;

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

			if( ( aerr < berr ) && ( aerr < cerr ) )
			{
				pixels[ i++ ] += par;
				pixels[ i++ ] += pag;
				pixels[ i++ ] += pab;
			}
			else if( berr < cerr )
			{
				pixels[ i++ ] += pbr;
				pixels[ i++ ] += pbg;
				pixels[ i++ ] += pbb;
			}
			else
			{
				pixels[ i++ ] += pcr;
				pixels[ i++ ] += pcg;
				pixels[ i++ ] += pcb;
			}
			
			i++;
		}
	}
}

