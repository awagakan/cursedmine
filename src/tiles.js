"use strict";

var TileData = function()  {
	var that = {};
  var Tile = require('./tile').Tile;
	//ヌル
  that.nullTile = Tile({});
	//床
	that.floorTile = Tile({
		name: 'floorTile',
		character: '.',
		walkable: true,
		blocksLight: false
	});
	//壁
  that.wallTile = Tile({
		name: 'wallTile',
		character: ''
		,foreground: 'goldenrod'
		,walkable: false
		,diggable: false //true 
	});	
	//扉
	that.doorTile = Tile({
		name: 'doorTile',
		character: '/', //'■', //'+',
		foreground: 'goldenrod',
		walkable: true
		//,blocksLight: false
	});
	//通路
	that.corridorTile = Tile({
		name: 'corridorTile',
		character: '░', //'▒',
		foreground: 'white',
	  //background: 'gray',
		walkable: true
		,blocksLight: false
	});
	//上り階段
	that.stairsUpTile = Tile({
		name: 'stairsUpTile',
		character: '<',
		walkable: true
		,blocksLight: false
	});
	//下り階段
	that.stairsDownTile = Tile({
		name: 'stairsDownTile',
		character: '>',
		walkable: true
		,blocksLight: false
	});
	return that;
};

module.exports = {
	TileData: TileData
}
