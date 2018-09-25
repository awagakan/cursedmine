"use strict";

var Glyph = require('./glyph').Glyph;

var Tile = function (properties) {
	properties = properties || {};
	var that = Glyph(properties);

	var name = properties.name || 'nullTile';
	var walkable = properties.walkable || false;
	var diggable = properties.diggable || false;
	var blocksLight = (properties.blocksLight !== undefined) ?
		properties.blocksLight : true;
	var existWall = properties.existWall || true;

	that.getName = function() {
		return name;
	}

	that.isWalkable = function () {
		return walkable;
	}

	that.isDiggable = function () {
		return diggable;
	}

	that.isBlockingLight = function () {
		return blocksLight;
	}

	that.switchBlocksLight = function () {
		blocksLight = !blocksLight;
	}

	that.existWall = function () {
		return existWall;
	}

	return that;
};

module.exports = {
	Tile: Tile
}
