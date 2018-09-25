'use strict'

var Entity = require('./entity').Entity;

//設備
var Equipment = function(properties) {
	var properties = properties || {};
	properties.speed = 110;
	var character  = properties.character;
	var foreground = properties.foreground;
	//var that = DynamicGlyph(properties);
	var that = Entity(properties);

  var init = function () {
		if (that.hasMixin('Trap')) {
		  that.setChar('.');
		  that.setForeground('white');
		}
	}

	that.act = function () {
		var map = that.getMap();
		var entity = map.getEntityAt(that.getX(), that.getY(), that.getZ());
		if (entity) {
			that.trigger(entity);
		  that.setChar(character);
		  that.setForeground(foreground);
		}
	}

	init();
	
	return that;
}

module.exports = {
	Equipment: Equipment 
}


