var Entity = require('./entity').Entity;

var Storage = function(game) {
	var that = {};
	var data = {};
  var Monsters = require('./monsters').Monsters(game);
	
	that.save = function(tiles, entities) {
		data.tiles = new Array(tiles.length);
    for (var z = 0; z < tiles.length; z++) {
			data.tiles[z] = new Array(tiles[z].length);
			for (var x = 0; x < tiles[z].length; x++) {
				data.tiles[z][x] = new Array(tiles[z][x].length);
				for (var y = 0; y < tiles[z][x].length; y++) {
					data.tiles[z][x][y] = tiles[z][x][y].getName();
				}
			}
		}
		data.entities = [];
		var i = 0;
    for (var pname in entities) {
			data.entities[i++] = {
		    templateName: entities[pname].getTemplateName(),
			  x   : entities[pname].getX(),
			  y   : entities[pname].getY(),
			  z   : entities[pname].getZ()	
			};
		}
		console.log(JSON.stringify(data.entities));

		localStorage.tiles = data.tiles;
		localStorage.entities = data.entities;
	}

	//screens.jsのplayscreenのenter関数で呼び出す
	that.load = function(map) {
		tiles = localStorage.tiles;
		entities = localStorage.entities;
		map.resetData(data); //タイルとエンティティオブジェクト作成後にロードしたデータで再配置をする
		return map;
	}

	return that;
}

module.exports = {
	Storage: Storage
}
