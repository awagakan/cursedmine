"use strict";

//var Builder = function (game, width, height, depth) {
var Builder = function (width, height, depth) {
	var that = {};
	var TileData = require('./tiles').TileData;
	var TileData = TileData();
  //var TileData = require('./tile').TileData;
	var tiles = new Array(depth);
	var branch = new Array(10); //分岐
	var regions = new Array(depth); //階層

	var init = function () {
		for (var z = 0; z < depth; z++) {
			//tiles[z] = that.generateLevel.cellular();
			//tiles[z] = that.generateLevel.digger();
			tiles[z] = that.generateLevel.rogue();
			regions[z] = new Array(width);
			for (var x = 0; x < width; x++) {
				regions[z][x] = new Array(height);
				for (var y = 0; y < height; y++) {
					regions[z][x][y] = 0;
          //ついでに端の床タイルを壁タイルに変換
					if (x === 0 || x === width-1 || y === 0 || y === height-1) {
						if (tiles[z][x][y].getName() === 'floorTile') {
						  tiles[z][x][y] = TileData.wallTile;
						}
					}
				}
			}
		}

		tiles = adjWall(tiles);

		for (var z = 0; z < depth; z++) {
			that.setupRegions(z);
		}
		that.connectAllRegions();
	}
	
	//周囲８マスからランダムな座標を取得
  var getNeighborPositions = function (x, y) {
		var tiles = [];
		for (var dx = -1; dx < 2; dx++) {
			for (var dy = -1; dy < 2; dy++) {
				if (dx == 0 && dy == 0) {
					continue;
				}
				tiles.push({x: x+dx, y: y+dy});
			}
		}
		return tiles.randomize();
	}

	//孤立した壁タイルを床タイルに変換
	var adjWall = function(tiles) {
		var keys = [];
		for (var z = 0; z < depth; z++) {
			for (var x = 0; x < width; x++) {
				for (var y = 0; y < height; y++) {
					var fCnt = 0; //floor count
					var wCnt = 0; //wall count
					for (var i = 0; i < 7; i++) {
					//for (var i = 0; i < 3; i++) {
						var diff = ROT.DIRS[8][i];
						//var diff = ROT.DIRS[8][i*2];
						var dx = x + diff[0];
						var dy = y + diff[1];
            if (dx < 0 || dy < 0 || dx >= width || dy >= height) continue;
						if (i % 2 === 0) {
						  if (tiles[z][dx][dy].getName() === 'floorTile') fCnt++;
						}
						if (tiles[z][dx][dy].getName() === 'wallTile') wCnt++;
					}
					//if (cnt >= 5) keys.push(x+","+y+","+z);
					if ((fCnt >= 3) && (wCnt = 3)) keys.push(x+","+y+","+z);
				}
			}
  	}
		for (var i = 0; i < keys.length; i++) {
     	var parts = keys[i].split(",");
	  	var x = parseInt(parts[0]);
	  	var y = parseInt(parts[1]);
			var z = parseInt(parts[2]);
	  	tiles[z][x][y] = TileData.floorTile;
	  }
		return tiles;
	}

	//マップ生成
	that.generateLevel = {};

	/*洞窟型（cellular）*/
	that.generateLevel.cellular = function () {
    var map = new Array(width);
		for (var w = 0; w < width; w++) {
			map[w] = new Array(height);
		}

		var generator = new ROT.Map.Cellular(width, height, {connected: true});
	  generator.randomize(0.5);
		var totalIterations = 1;//4;
		for (var i = 0; i < totalIterations; i++) {
			generator.create();
		}
    var generatorCallback = function (x, y, v) { 
			if (v === 1) {
				//map[x][y] = game.floorTile;
				map[x][y] = TileData.floorTile;
			} else {
				//map[x][y] = game.wallTile;
				map[x][y] = TileData.wallTile;
			}
		};
	  generator.connect(generatorCallback.bind(that),1);
    return map;
	}

	/*ダンジョン型(Digger)*/
	that.generateLevel.digger = function () {
		var map = new Array(width);
		for (var w = 0; w < width; w++) {
			map[w] = new Array(height);
		}
    //var generator = new ROT.Map.Rogue(width, height);
    var generator = new ROT.Map.Digger(width, height);
	  //generator.randomize(0.5);
		var totalIterations = 4;
		for (var i = 0; i < totalIterations; i++) {
			generator.create();
		}
    var generatorCallback = function (x, y, v) { 
			//if (v) {
			if (v === 1) {
				//map[x][y] = game.wallTile;
				map[x][y] = TileData.wallTile;
			} else {
				//map[x][y] = game.floorTile;
				if (v === 0) {
				  map[x][y] = TileData.floorTile;
				} else if (v === 2) {
					map[x][y] = TileData.corridorTile;
				}
			}
		};
	  //generator.connect(generatorCallback.bind(that),1);
	  generator.create(generatorCallback.bind(that));

		var rooms = generator.getRooms();
		var drawDoor = function (x, y) {
			//map[x][y] = game.doorTile;
			map[x][y] = TileData.doorTile;
		}

		for (var i=0; i<rooms.length; i++) {
			var room = rooms[i];
			room.getDoors(drawDoor);
		}
		return map;
	}

  /*ダンジョン型(Rogue)*/
	that.generateLevel.rogue = function () {
		var map = new Array(width);
		for (var w = 0; w < width; w++) {
			map[w] = new Array(height);
		}
    var generator = new ROT.Map.Rogue(width, height);
	  //generator.randomize(0.5);
		var totalIterations = 4;
		for (var i = 0; i < totalIterations; i++) {
			generator.create();
		}
    var generatorCallback = function (x, y, v) { 
			//if (v) {
			if (v === 1) {
				//map[x][y] = game.wallTile;
				map[x][y] = TileData.wallTile;
			} else {
				//map[x][y] = game.floorTile;
				if (v === 0) {
				  map[x][y] = TileData.floorTile;
				} else if (v === 2) {
					map[x][y] = TileData.corridorTile;
				} else if (v === 3) {
					map[x][y] = TileData.doorTile;
				}
			}
		};
	  //generator.connect(generatorCallback.bind(that),1);
	  generator.create(generatorCallback.bind(that));

		return map;
	}

	//座標を埋めれるか
	that.canFillRegion = function (x, y, z) {
		if (x < 0 || y < 0 || z < 0 || 
		    x >= width || y >= height || z >= depth) {
			  return false;
		}
		if (regions[z][x][y] != 0) {
			return false;
		}
		return tiles[z][x][y].isWalkable();
	}

	//
	that.fillRegion = function (region, x, y, z) {
		var tilesFilled = 1;
		var tiles = [{x: x, y: y}];
		var tile;
		var neighbors;
		regions[z][x][y] = region;

		while (tiles.length > 0) {
			tile = tiles.pop();
			//neighbors = game.getNeighborPositions(tile.x, tile.y);
			neighbors = getNeighborPositions(tile.x, tile.y);

			while (neighbors.length > 0) {
				tile = neighbors.pop();
				if (that.canFillRegion(tile.x, tile.y, z)) {
					regions[z][tile.x][tile.y] = region;
					tiles.push(tile);
					tilesFilled++;
				}
			}
		}
		return tilesFilled;
	}

	//指定した階層のリージョンナンバーをすべて初期化して壁タイルで埋める
	that.removeRegion = function (region, z) {
		for (var x = 0; x < width; x++) {
			for (var y = 0; y < height; y++) {
				//if (regions[z][x][y] == regionf) {
				if (regions[z][x][y] == region) {
					regions[z][x][y] = 0;
					//tiles[z][x][y] = game.wallTile;
					tiles[z][x][y] = TileData.wallTile;
				}
			}
		}
	}

	//指定した階層のリージョンを設定する
	that.setupRegions = function (z) {
		var region = 1;
		var tilesFilled;
		for (var x = 0; x < width; x++) {
			for (var y = 0; y < height; y++) {
				if (that.canFillRegion(x, y, z)) {
					tilesFilled = that.fillRegion(region, x, y, z);
					if (tilesFilled <= 20) {
						that.removeRegion(region, z);
					} else {
						region++;
					}
				}
			}
		}
	}

	//上と下で重なっているリージョンを探す
	that.findRegionOverlaps = function (z, r1, r2) {
		var matches = [];
		for (var x = 0; x < width; x++) {
			for (var y = 0; y < height; y++) {
				//if (tiles[z][x][y] == game.floorTile && tiles[z+1][x][y] ==game.floorTile &&
				if (tiles[z][x][y].getName() === 'floorTile' && tiles[z+1][x][y].getName() === 'floorTile' &&
						regions[z][x][y] == r1 &&
						regions[z][x][y] == r2) {
					  matches.push({x: x, y: y});
				}
			}
		}
		return matches.randomize();
	}

	//重なっているリージョンのタイルを上階段、下階段にする
	that.connectRegions = function (z, r1, r2) {
		var overlap = that.findRegionOverlaps(z, r1, r2);
		if (overlap.length == 0) {
			return false;
		}
		var point = overlap[0];
		//tiles[z][point.x][point.y] = game.stairsDownTile;
		tiles[z][point.x][point.y] = TileData.stairsDownTile;
		//tiles[z+1][point.x][point.y] = game.stairsUpTile;
		tiles[z+1][point.x][point.y] = TileData.stairsUpTile;
		return true;
	}

	//地下１階から最深部までの階段をすべてつなげる
	that.connectAllRegions = function () {
		for (var z = 0; z < depth-1; z++) {
			var connected = {};
			var key;
			for (var x = 0; x < width; x++) {
				for (var y = 0; y < height; y++) {
					key = regions[z][x][y] + '.' +regions[z+1][x][y];
					//if (tiles[z][x][y] == game.floorTile && tiles[z+1][x][y] == game.floorTile &&
					if (tiles[z][x][y].getName() === 'floorTile' && tiles[z+1][x][y].getName() === 'floorTile' &&
							!connected[key]) {
						  that.connectRegions(z, regions[z][x][y], regions[z+1][x][y]);
							connected[key] = true;
					}
				}
			}
		}
	}

	that.getTiles = function () {
		return tiles;
	}
	that.getDepth = function () {
		return depth;
	}
	that.getWidth = function () {
		return width;
	}
	that.getHeight = function () {
		return height;
	}

	init();

	return that;
}

module.exports = {
	Builder: Builder
}



