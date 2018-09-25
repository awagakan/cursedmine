"use strict";

//var Map = function (game, tiles, player) {
var Map = function (tiles, player) {
	var that = {};
	var tiles = tiles;
	var depth = tiles.length;
	var width = tiles[0].length;
  var height = tiles[0][0].length;
	var fov = [];
	//var explored = new Array(depth);
	var exploredCells  = {};
	var memorizedCells = {};

	var Entity = require('./entity').Entity;
	var Monsters = require('./monsters').Monsters;
	var Items = require('./items').Items;
	var Equipments = require('./equipments').Equipments;
	var Dice = require('./dice').Dice();

	var entities = {};
	var items = {};
	var equipments = {};
	//var scheduler = new ROT.Scheduler.Simple();
	var scheduler = new ROT.Scheduler.Speed();
	var engine = new ROT.Engine(scheduler);

	that.ID = 'map';
	var TileData = require('./tiles').TileData();

	//コンストラクタ
	var init = function () {
    var monsters = Monsters();
	  var items = Items();
		var equipments = Equipments();

		that.setupFov();

		//
		//that.clearData();
		//player.clearData();
    if (JSON.parse(window.localStorage.getItem('tiles'))) {
	 		that.loadData();
	 		player.loadData();
	 	} else {
	 		that.newData(player);
	 	}

    
    //that.addEntityAtRandomPosition(player, 0);

		////モンスター：アイテム：設備 = 5 : 5 : 2　で生成
		//for (var z = 0; z < depth; z++) {
    //  for (var i = 0; i < 15; i++) {
		//		if (_.contains([1,2,3,4,5], Dice.xdx(1, 12)())) {
		//		  that.addEntityAtRandomPosition(Monsters(z).Repository.createRandom(), z);
		//		} else 
		//		if (_.contains([6,7,8,9,10], Dice.xdx(1, 12)())) {
		//		  that.addItemAtRandomPosition(items.Repository.createRandom(), z);
		//		} else
		//		if (_.contains([11,12], Dice.xdx(1, 12)())) {
		//		  that.addEquipmentAtRandomPosition(equipments.Repository.createRandom(), z);
		//		}
	  //  }
		//}
		//that.addEquipmentAtRandomPosition(Monsters(depth-1).Repository.create('Dragon'), depth-1);

		//that.setupEquipments(equipments);

		//that.setupExploredArray();
	}

	var jsonTest = function () {
    Function.prototype.toJSON = Function.prototype.toString;
		var jsonText = JSON.stringify(tiles[player.getZ()]);
		var parser = function(k,v){return v.toString().indexOf('function') === 0 ? eval('('+v+')') : v};
	}

  that.newData = function (player) {
    that.addEntityAtRandomPosition(player, 0);
		//モンスター：アイテム：設備 = 5 : 5 : 2　で生成
		for (var z = 0; z < depth; z++) {
      for (var i = 0; i < 15; i++) {
				if (_.contains([1,2,3,4,5], Dice.xdx(1, 12)())) {
				  that.addEntityAtRandomPosition(Monsters(z).Repository.createRandom(), z);
				} else 
				if (_.contains([6,7,8,9,10], Dice.xdx(1, 12)())) {
				  that.addItemAtRandomPosition(Items().Repository.createRandom(), z);
				} else
				if (_.contains([11,12], Dice.xdx(1, 12)())) {
				  that.addEquipmentAtRandomPosition(Equipments().Repository.createRandom(), z);
				}
	    }
		}
		that.addEntityAtRandomPosition(Monsters(depth-1).Repository.create('Dragon'), depth-1);
		that.setupEquipments();
		that.setupExploredArray();
	}	

	that.saveData = function () {
		var data = {};
    for (var z = 0; z < depth; z++) {
			for (var x = 0; x < width; x++) {
				for (var y = 0; y < height; y++) {
					data[x+','+y+','+z] = tiles[z][x][y].getName();
				}
			}
		}
		window.localStorage.setItem('tiles', JSON.stringify(data));

    var data = exploredCells;
		window.localStorage.setItem('exploredCells', JSON.stringify(data));

    var data = memorizedCells;
		window.localStorage.setItem('memorizedCells', JSON.stringify(data));

		var data = _.map(entities, function (value, key) {
			return {name: value.getIdName(), key: key};
		});
		window.localStorage.setItem('entities', JSON.stringify(data));

    var data = _.map(items, function (value, key) {
			if (_.isArray(value)) {
				return {items: _.map(value, function (value) {
					return value.getIdName();
				}), key: key};
			} else {
				return {name: value.getIdName, key: key};
			}
		});
		window.localStorage.setItem('items', JSON.stringify(data));

    var data = _.map(equipments, function (value, key) {
			return {name: value.getIdName(), key: key};
		});
		window.localStorage.setItem('equipments', JSON.stringify(data));
		
	}

	
	that.loadData = function () {
		var data = JSON.parse(window.localStorage.getItem('tiles'))
    for (var z = 0; z < depth; z++) {
			for (var x = 0; x < width; x++) {
				for (var y = 0; y < height; y++) {
					tiles[z][x][y] = TileData[data[x+','+y+','+z]];
				}
			}
		}
		if (JSON.parse(window.localStorage.getItem('exploredCells'))) {
      exploredCells  = JSON.parse(window.localStorage.getItem('exploredCells'));
		}
		if (JSON.parse(window.localStorage.getItem('memorizedCells'))) {
		  memorizedCells = JSON.parse(window.localStorage.getItem('memorizedCells'));
		}

		var data = JSON.parse(window.localStorage.getItem('entities'));
		_.each(data, function (value) {
			var parts = value.key.split(',');
      var x = parseInt(parts[0]);
			var y = parseInt(parts[1]);
			var z = parseInt(parts[2]);
			if (value.name) {
			  that.addEntity(x, y, z, Monsters().Repository.create(value.name)); 
			} else {
				that.addEntity(x, y, z, player);
			}
		});
    var data = JSON.parse(window.localStorage.getItem('items'))
		_.each(data, function (value) {
			var parts = value.key.split(',');
      var x = parseInt(parts[0]);
			var y = parseInt(parts[1]);
			var z = parseInt(parts[2]);
			_.each(value.items, function (value) {
			  that.addItem(x, y, z, Items().Repository.create(value));
			});
		});
    var data = JSON.parse(window.localStorage.getItem('equipments'))
		_.each(data, function (value) {
			var parts = value.key.split(',');
      var x = parseInt(parts[0]);
			var y = parseInt(parts[1]);
			var z = parseInt(parts[2]);
			that.addEquipment(x, y, z, Equipments().Repository.create(value.name)); 
		});
	}

	that.clearData = function () {
		window.localStorage.removeItem('tiles');
    window.localStorage.removeItem('exploredCells');
		window.localStorage.removeItem('memorizedCells');
		window.localStorage.removeItem('entities');
		window.localStorage.removeItem('items');
		window.localStorage.removeItem('equipments');
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

	that.getTile = function (x, y, z) {
		if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) {
		  //return game.nullTile;
		  return TileData.nullTile;
		} else {
		  //return tiles[z][x][y] || game.nullTile;
		  return tiles[z][x][y] || TileData.nullTile;
		}
	}

	that.isFloorTile = function (x, y, z) {
		if (tiles[z].hasOwnProperty(x)) {
			if (tiles[z][x].hasOwnProperty(y)) {
				//if (tiles[z][x][y] == game.floorTile) {
				if (tiles[z][x][y].getName() === 'floorTile') {
				 return true;
				}
			}
		}
		return false;
	}

	that.isWallTile = function (x, y, z) {
    if (tiles[z].hasOwnProperty(x)) {
			if (tiles[z][x].hasOwnProperty(y)) {
				//if (tiles[z][x][y] == game.floorTile) {
				if (tiles[z][x][y].getName() === 'wallTile') {
				 return true;
				}
			}
		}
		return false;
	}

	that.needPartition = function (x, y, z) {
    if (tiles[z].hasOwnProperty(x)) {
			if (tiles[z][x].hasOwnProperty(y)) {
				//if (tiles[z][x][y] == game.floorTile) {
				if ((tiles[z][x][y].getName() === 'floorTile') 
				|| (tiles[z][x][y].getName() === 'stairsUpTile') 
				|| (tiles[z][x][y].getName() === 'stairsDownTile')){
				 return true;
				}
			}
		}
		return false;
	}


	//ある座標の壁仕切り文字を取得（壁かどうかの判定はscreen.jsで行う）
	that.getPartitionChr = function (x, y, z) {
		//var chr = tiles[z][x][y].getChar();
		var chr = "";
		//var tile = that.getTile(x, y, z);

		if (tiles[z][x][y].getName() === "wallTile") {
		//if (tile.getName() === "wallTile") {
			if (that.needPartition(x-1,y-1,z)) chr = "┘";	
		  if (that.needPartition(x+1,y-1,z)) chr = "└";
		  if (that.needPartition(x-1,y+1,z)) chr = "┐";
		  if (that.needPartition(x+1,y+1,z)) chr = "┌";

		  if ((that.needPartition(x-1,y,z)) && (that.needPartition(x,y-1,z))) { 
		    //return chr = "┌";                                                        
		    chr = "┌";                                                        
		  } else                                                                  
		  if ((that.needPartition(x-1,y,z)) && (that.needPartition(x,y+1,z))) { 
		    //return chr = "└";                                                     
		    chr = "└";                                                     
		  } else                                                                  
      if ((that.needPartition(x+1,y,z)) && (that.needPartition(x,y-1,z))) { 
		    //return chr =  "┐";                                                       
		    chr = "┐";                                                       
		  } else                                                                  
      if ((that.needPartition(x+1,y,z)) && (that.needPartition(x,y+1,z))) { 
		    //return chr = "┘";                                                     
		    chr = "┘";                                                     
	    } else {
        if (that.needPartition(x-1,y,z)) chr = "│";                   
	      if (that.needPartition(x+1,y,z)) chr = "│";                   
	      if (that.needPartition(x,y-1,z)) chr = "─";                   
	      if (that.needPartition(x,y+1,z)) chr = "─"; 
			}
		}
		return chr;                                                             
  }                                                                        

	that.dig = function (x, y, z) {
		if (that.getTile(x, y, z).isDiggable()) {
		  //tiles[z][x][y] = game.floorTile;
		  tiles[z][x][y] = TileData.floorTile;
		}
	}

	that.getEngine = function () {
		return engine;
	}

	that.getEntities = function () {
		return entities;
	}

	//ある座標の物体を取得
	that.getEntityAt = function (x, y, z) {
		return entities[x + ',' + y + ',' + z];
	}	

	//物体をマップ配列とスケジューラに追加する
	that.addEntity = function (x, y, z, entity) {
		entity.setMap(that);
    entity.setX(x);
	  entity.setY(y);
	  entity.setZ(z);
		that.updateEntityPosition(entity);
		//このentityがActorかどうか調べる
		if (entity.hasMixin('Actor')) {
			scheduler.add(entity, true);
		}
	}

	that.getRandomFloorPosition = function (_z) {
		var _x, _y;
		var r;
		do {
			_x = Math.floor(Math.random() * width);
			_y = Math.floor(Math.random() * height);
		} while (!that.isEmptyFloor(_x, _y, _z));
		return {x: _x, y: _y, z: _z};
	}

	//物体をランダムな位置に出現させる
	that.addEntityAtRandomPosition = function (entity, z) {
		if (entity) {
		  var position = that.getRandomFloorPosition(z);
		  that.addEntity(position.x, position.y, position.z, entity);
		}
	}

	//物体を削除
	that.removeEntity = function (entity) {
		var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
		if (entities[key] === entity) {
			delete entities[key];
		}
		if (entity.hasMixin('Actor')) {
			scheduler.remove(entity);
		}
	}

	//ある座標に物体が存在するかのチェック
	that.isEmptyFloor = function (x, y, z) {
		//return that.getTile(x, y, z) === game.floorTile &&
		return that.getTile(x, y, z).getName() === 'floorTile' 
			  && !that.getEntityAt(x, y, z)
			  && !that.getEquipmentAt(x, y, z);
	}

	//指定座標から一定の範囲内にいるグリフをすべて返す
	that.getGlyphsWithinRadius = function (glyphs) { 
		return function (centerX, centerY, centerZ, radius) {
		  var results = [];
		  var leftX = centerX - radius;
		  var rightX = centerX + radius;
		  var topY = centerY - radius;
		  var bottomY = centerY + radius;

		  for (var key in glyphs) {
		  	var glyph = glyphs[key];
        if (glyph.getX() >= leftX &&
		  		  glyph.getX() <= rightX && 
		  		  glyph.getY() >= topY &&
		  		  glyph.getY() <= bottomY && 
		  		  glyph.getZ() == centerZ) {
		  		    results.push(glyph);
		  	}
		  }
		  return results;
		}
	}

	//指定座標から一定の範囲内にいる物体をすべて返す
	that.getEntitiesWithinRadius = function (centerX, centerY, centerZ, radius) {
		return that.getGlyphsWithinRadius(entities)(centerX, centerY, centerZ, radius);
		//var results = [];
		//var leftX = centerX - radius;
		//var rightX = centerX + radius;
		//var topY = centerY - radius;
		//var bottomY = centerY + radius;

		//for (var key in entities) {
		//	var entity = entities[key];
    //  if (entity.getX() >= leftX &&
		//		  entity.getX() <= rightX && 
		//		  entity.getY() >= topY &&
		//		  entity.getY() <= bottomY && 
		//		  entity.getZ() == centerZ) {
		//		    results.push(entity);
		//	}
		//}
		//return results;
	}
  
	//指定座標から一定の範囲内に対象の物体があるかどうか
	that.isEntityWithinRadius = function (centerX, centerY, centerZ, radius, entity) {
    var entities = that.getEntitiesWithinRadius(centerX, centerY, centerZ, radius);
		return _.some(entities, function (value, index) {
			if (value = entity) { 
				return true; 
			} else {
			  return false;
			}
		});
	}

  //指定座標から一定の範囲内にある設備をすべて返す
	that.getEquipmentsWithinRadius = function (centerX, centerY, centerZ, radius) {
		return that.getGlyphsWithinRadius(equipments)(centerX, centerY, centerZ, radius);
	}

  //指定座標から一定の範囲内にある対象の設備のリストを返す
	that.getTileWithinRadius = function (centerX, centerY, centerZ, radius, name) {
    var tiles = that.getEquipmentsWithinRadius(centerX, centerY, centerZ, radius);
	  return _.filter(tiles, function (value, index) {
			return value.hasMixin(name);
			//17.10.01
	  	//if (value.hasMixin(name)) { 
	  	//	return true; 
	  	//} else {
	  	//  return false;
	  	//}
	  });
	}

	//周囲８マスからランダムな座標を取得
  that.getNeighborPositions = function (x, y) {
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

	that.setupFov = function () {
		var map = that;
    for (var z = 0; z < depth; z++) {
			(function () {
			var depth = z;
			fov.push(
					new ROT.FOV.DiscreteShadowcasting(function(x, y) {
						var player = that.getPlayer();
						//return !that.getTile(x, y, depth).isBlockingLight(); //17.09.10 
						return !that.getTile(x, y, depth).isBlockingLight() || player.isPosition(x, y, depth);
          }, {topology: 4})
			);
		  })();
		}
	}			

	that.getFov = function(depth) {
		return fov[depth];
	}

	that.updateEntityPosition = function(entity, oldX, oldY, oldZ) {
		//↓↓javascriptでは0はFalseとして扱われるのでこの判断はできない
		//if (oldX) {
		if (typeof oldX === 'number') {
			var oldKey = oldX + ',' + oldY + ',' + oldZ;
			if (entities[oldKey] === entity) {
				delete entities[oldKey];
			}
		}

		if (entity.getX() < 0 || entity.getX() >= width ||
				entity.getY() < 0 || entity.getY() >= height ||
				entity.getZ() < 0 || entity.getZ() >= depth) {
			//throw new Error("Entity's position is out of bounds.");
		}

		var key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
		if (entities[key]) {
			throw new Error("Tried to add an entity at an occupied position.");
		}
		entities[key] = entity;
	}

	that.getItemsAt = function(x, y, z) {
		return items[x + ',' + y + ',' + z];
	}

	that.setItemsAt = function(x, y, z, _items) {
		var key = x + ',' + y + ',' + z;
		if (_items.length === 0) {
			if (items[key]) {
				delete items[key];
			}
		} else {
			items[key] = _items;
		}
	}

	//アイテムは同座標に重ねて配置することができるので配列として持つ
	that.addItem = function(x, y, z, item) {
		var key = x + ',' + y + ',' + z;
		if (items[key]) {
			items[key].push(item);
		} else {
			items[key] = [item];
		}
	}

	that.addItemAtRandomPosition = function(item, z) {
		var position = that.getRandomFloorPosition(z);
		that.addItem(position.x, position.y, position.z, item);
	}

  that.getEquipmentAt = function(x, y, z) {
		return equipments[x + ',' + y + ',' + z];
	}
	
	that.addEquipment = function (x, y, z, equipment) {
		equipment.setMap(that);
		equipment.setX(x);
		equipment.setY(y);
		equipment.setZ(z);
		scheduler.add(equipment, true);
    var key = x + ',' + y + ',' + z;
	  equipments[key] = equipment;
	}

	that.addEquipmentAtRandomPosition = function(equipment, z) {
		var position = that.getRandomFloorPosition(z);
    //equipment.setX(position.x);
		//equipment.setY(position.y);
		//equipment.setZ(position.z);
		that.addEquipment(position.x, position.y, position.z, equipment);
	}

  //デフォルトで配置する設備をセット
	that.setupEquipments = function () {
		for (var z = 0; z < depth; z++) {
			for (var x = 0; x < width; x++) {
				for (var y = 0; y < height; y++) {
					if (tiles[z][x][y].getName() === "stairsUpTile") {
						that.addEquipment(x, y, z, Equipments().Repository.create("upStairs"));
					}
	        if (tiles[z][x][y].getName() === "stairsDownTile") {
						that.addEquipment(x, y, z, Equipments().Repository.create("downStairs"));
					}
				}
			}
		}
	}

	//探索したマップを記憶させる配列の初期化
	that.setupExploredArray = function () {
		for (var z = 0; z < depth; z++) {
			//explored[z] = new Array(width);
			for (var x = 0; x < width; x++) {
				//explored[z][x] = new Array(height);
				for (var y = 0; y < height; y++) {
					//explored[z][x][y] = false;
					exploredCells[x + "," + y + "," + z] = false;  
				}
			}
		}
	}

	//探索したマップを配列に記憶させる
	that.setExplored = function (x, y, z, state) {
		if (that.getTile(x, y, z) !== TileData.nullTile) {
			//explored[z][x][y] = state;
			exploredCells[x + "," + y + "," + z] = state;  
      var items = that.getItemsAt(x, y, z);
			//var glyph = that.getTile(x, y, z);
		  if (items && !that.getEntityAt(x, y, z)) {//対象の座標にアイテムがあり物体がない場合 
		 	  //var glyph = items[items.length -1];
			  memorizedCells[x + "," + y + "," + z] = state;
		  }
			//memorizedCells[x + "," + y + "," + z] = glyph;
		}
	}

	that.isExplored = function (x, y, z) {
		if (that.getTile(x, y, z) !== TileData.nullTile) {
			//return explored[z][x][y];
			return exploredCells[x + "," + y + "," + z];
		} else {
			return false;
		}
	}

	//プレイヤーが記憶したセル情報を返す
	that.getMemorizedCell = function (x, y, z) {
		if (that.getTile(x, y, z) !== TileData.nullTile) {//対象の座標に物体が存在しないとき
		  return memorizedCells[x + "," + y + "," + z];
		} else {
			return that.getTile(x, y, z);
		}
	}

	that.resetData = function (data) {
		//タイルリセット
		for (var z = 0; z < data.tiles.length; z++) {
			for (var x = 0; x < data.tiles[z].length; x++) {
				for (var y = 0; y < data.tiles[z][x].length; y++) {
					//tiles[z][x][y] = game[data.tiles[z][x][y]];
					tiles[z][x][y] = TileData[data.tiles[z][x][y]];
				}
			}
		}
		//エンティティリセット  	
		//entities = {};
		//for (var i = 0; i < data.entities.length; i++) {
		//	var key = data.entities[i].x + ',' + data.entities[i].y + ',' + data.entities[i].z;
	}

	that.getPlayer = function () {
		return player;
	}

	init();
  
	return that;
};	

module.exports = {
	Map: Map
};
