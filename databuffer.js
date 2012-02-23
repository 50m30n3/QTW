/*
*    QTW: databuffer.js (c) 2011, 2012 50m30n3
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

function DataBuffer( data )
{
	this.data = data;
	this.buffer = 0x00;
	this.pos = 0;
	this.bits = 8;
	
	this.getByte = function()
	{
		return this.data[this.pos++];
	}
	
	this.getBit = function()
	{
		if( this.bits >= 8 )
		{
			this.buffer = this.data[this.pos++];
			this.bits = 0;
		}

		var result = (this.buffer>>this.bits++)&0x01;
		
		return result;
	}
}

