"use strict";

var Tile = require('./tile').Tile;

var TileData = function() {
	var that = {};
//タイル
	that.nullTile  = Tile({});
	//床
	that.floorTile = Tile({
		character: '.',
		walkable: true,
		blocksLight: false
	});
	//壁
  that.wallTile  = Tile({
		character: ''
		//foreground: 'goldenrod'
		,diggable: false//true
		,blocksLight: true 
	});	
	//扉
	that.door = Tile({
		character: '+',
		foreground: 'goldenrod',
		walkable: true
		,blocksLight: false
	});
	//通路
	that.corridor = Tile({
		character: '#',
	  background: 'gray',
		walkable: true
		,blocksLight: false
	});
	//上り階段
	that.stairsUpTile = Tile({
		character: '<',
		foreground: 'white',
		walkable: true
		,blocksLight: false
	});
	//下り階段
	that.stairsDownTile = Tile({
		character: '>',
		foreground: 'white',
		walkable: true
		,blocksLight: false
	});

	return that;
}

module.exports = {
	TileData: TileData()
}
