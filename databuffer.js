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

