"use strict";

var Glyph = function (properties) {
	var that =  {};
	//var that = properties;
	//var that =  {};
	var properties = properties || {};
	var chr = properties['character']	|| ' ';
	var foreground = properties['foreground'] || 'white';
	var background = properties['background'] || '#1C1C1C'; //'#222'; //'black';
	
	that.getChar = function () {
		return chr;
	};

	that.setChar = function (_chr) {
		chr = _chr;
	};

	that.getBackground = function () {
		return background;
	};

	that.getForeground = function () {
		return foreground;
	};

	that.setForeground = function (_foreground) {
		foreground = _foreground;
	};

	return that;
};

module.exports = {
	Glyph: Glyph
};
