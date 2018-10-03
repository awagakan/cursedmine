(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
			tiles[z] = that.generateLevel.cellular();
			//tiles[z] = that.generateLevel.digger();
			//tiles[z] = that.generateLevel.rogue();
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




},{"./tiles":21}],2:[function(require,module,exports){
var Entity = require('./entity').Entity;
var Dice = require('./dice').Dice();
var Items = require('./items').Items();
var Message = require('./message').Message();

var Character = function (properties) {
	var that = Entity(properties);

	var abilities = {
		str: 8, // Dice.xdx(1,12)() + 6;
	  con: 8, // Dice.xdx(1,12)() + 6;
	  dex: 8, // 24 - con;
	  luc: 8, // Dice.xdx(1,12)() + 6;
		wiz: 8  // 24 - str;
	};
	var gold = Dice.xdx(3,6)() * 10;
  var defaultItems = ['shortSword', 'leatherArmor', 'food'];
	var lv  = 1;
	var exp = 0;

	var init = function () {
		//能力値割り振り
		//var keys = ['str','con','luc','dex','wiz'];
		//for (var i=0; i<20; i++) {
			//var d5 = Dice.xdx(1,5)() - 1;
		var keys = ['str','con','dex'];
		for (var i=0; i<12; i++) {
			var d5 = Dice.xdx(1,3)() - 1;
			abilities[keys[d5]]++;
		}
		//HP設定
		that.setHp(abilities.con);
		that.setMaxHp(abilities.con);
		//デフォルトアイテムのセット
	  for (var i=0; i<defaultItems.length; i++) {
			var item = Items.Repository.create(defaultItems[i]);
			that.addItem(item);
			if (item.hasMixin('Equippable')) {
			  that.equip(item);
			}	
		}
	}

	that.getStr = function () {
		return abilities.str;
	}
	that.getCon = function () {
		return abilities.con;
	}
  that.getDex = function () {
		return abilities.dex;
	}
	that.getLuc = function () {
		return abilities.luc;
	}
	that.getWiz = function () {
		return abilities.wiz;
	}
	that.setStr = function (str) {
		abilities.str = str;
	}
  that.setCon = function (con) {
		abilities.con = con;
	}
  that.setDex = function (dex) {
		abilities.dex = dex;
	}
  that.setLuc = function (luc) {
		abilities.luc = luc;
	}
  that.setWiz = function (wiz) {
		abilities.wiz = wiz;
	}

	//セービングスロー
	that.saveVs = function (ability) {
		return Dice.d20() <= abilities[ability];
	}
	//能力値ボーナス
	that.abilityBonus = function (ability) {
		return (abilities[ability] - 10); //12);
	}

	that.superGetAC = that.getAC;
	that.getAC = function () {
		return that.superGetAC() + that.abilityBonus('dex');
	}

	that.superHitRole = that.hitRole;
	that.hitRole = function () {
		return that.superHitRole() + that.abilityBonus('str');
	}

	that.getLv = function () {
		return lv;
	}

	that.setLv = function (_lv) {
		lv = _lv;
	}

	that.getExp = function () {
		return exp;
	}

	that.setExp = function (_exp) {
		exp = _exp;
	}

	that.addExp = function (_exp) {
		exp = exp + _exp;
	}

	that.levelUp = function () {
		if (exp >= 10*Math.pow(2, lv-1)) {
			lv++;
			var hp = that.getMaxHp() + Dice.xdx(1, abilities.con)();
			that.setMaxHp(hp);
			that.setHp(hp);
			Message.sendMessage(that, 'レベル%dにようこそ', [lv]);
			that.levelUp();
		}
	}

	that.saveData = function () {
		var data = {
			lv: that.getLv(),
			hp: that.getHp(),
			maxHp: that.getMaxHp(),
			exp: that.getExp(),
			str: that.getStr(),
			con: that.getCon(),
			dex: that.getDex(),
			items: _.map(that.getItems(), function (item) {
				var equipState = false;
        if (item.hasMixin('Equippable')) {
					equipState = item.getEquipState();
				}
				return {name: item.getIdName(), num: item.getNumber(), equipState: equipState};
			})
		};
		window.localStorage.setItem('character', JSON.stringify(data));
	}

	that.loadData = function () {
		var data = JSON.parse(window.localStorage.getItem('character'));
		if (data) {
		  that.setLv(parseInt(data.lv));
      that.setHp(parseInt(data.hp));
		  that.setMaxHp(parseInt(data.hp));
		  that.setExp(parseInt(data.exp));
		  that.setStr(parseInt(data.str));
		  that.setCon(parseInt(data.con));
		  that.setDex(parseInt(data.dex));
		  that.clearItems();
		  _.each(data.items, function (value) {
		  	var item = Items.Repository.create(value.name);
		  	item.setNumber(parseInt(value.num));
		  	that.addItem(item);
		  	if (value.equipState) {
		  	  that.equip(item);
		  	}	
		  });
		}
	}

	that.clearData = function () {
		window.localStorage.removeItem('character');
	}

	init();

	return that;
}

module.exports = {
	Character: Character
}

},{"./dice":3,"./entity":5,"./items":14,"./message":16}],3:[function(require,module,exports){
var Dice = function () {
	var that = {};
	
	that.xdx = function (time, dice) {
		return function () {
			var role = 0;
			for (var i=0; i<time; i++) {
		    role += 1 + Math.floor(Math.random() * dice);
			}
			return role;
		};
	};

	that.d20 = that.xdx(1, 20);

	return that;
}
module.exports = {
	Dice: Dice
}

},{}],4:[function(require,module,exports){
"use strict";

var Glyph = require('./glyph').Glyph;
var Message = require('./message').Message();

//var Entity = function (game, properties) {
var DynamicGlyph = function (properties) {
	var properties = properties || {};

	var that = Glyph(properties);

	var name = properties.name || '';
	var idName = properties.idName || '';

	that.attachedMixins = {};

	that.attachedMixinGroups = {};

  var mixins = properties.mixins || [];
	var actList = {};

	
	that.addMixin = function (mixin) {
		for (var key in mixin) {
			//17.8.20 test
      if (key === 'act') {
				actList[mixin.name] = mixin[key];
				//var superAct = that['act'];
				//var addedAct = mixin[key];
				//that['act'] = function () {
				//	if (superAct) { superAct.apply(that); }
				//	addedAct.apply(that);
				//}
			} else
			//17.8.20 test
	  	if (key != 'init' && key != 'name' && !that.hasOwnProperty(key)) {
	  		that[key] = mixin[key];
	  	}
	  }
	  //mixinの名前を追加
	  that.attachedMixins[mixin.name] = true;
	  //groupNameがあれば追加
	  if (mixin.groupName) {
	  	that.attachedMixinGroups[mixin.groupName] = true;
	  }
	  if (mixin.init) {
	  	that = mixin.init(that, properties);
	  	//mixin.init.call(this, properties);
	  }
	}

	that.delMixin = function (mixin) {
    for (var key in mixin) {
			//17.8.20 test
      if (key === 'act') {
				delete actList[mixin.name];
			} else if (key != 'init' && key != 'name') {
	  		delete that[key];
	  	}
	  }
	  //mixinの名前を追加
	  that.attachedMixins[mixin.name] = false;
		//他のMixinと被ることがあるのでgroupNameは残す
	  if (mixin.groupName) {
	  	//that.attachedMixinGroups[mixin.groupName] = false;
	  }
	}

  that.hasMixin = function (obj) {
		if (typeof obj === 'object') {
			return that.attachedMixins[obj.name];
		} else {
			return that.attachedMixins[obj] || that.attachedMixinGroups[obj];
		}
	}

	that.act = function () {
		for (var key in actList) {
			if (actList[key]) {
			  actList[key].apply(that);
			}
		}
	}

  that.setName = function (_name) {
		name = _name;
	}

	that.getName = function () {
		return name;
	}

	that.describe = function () {
		return that.getName();
	}

	that.getIdName = function () {
		return idName;
	}

  var init = function () {
	  var len = mixins.length;
	  for (var i = 0; i < len; i++) {
			that.addMixin(mixins[i]);
	  }
	}

	init();
		
  return that;
}

module.exports = {
  DynamicGlyph: DynamicGlyph
}

},{"./glyph":11,"./message":16}],5:[function(require,module,exports){
"use strict";

var Glyph = require('./glyph').Glyph;
var DynamicGlyph = require('./dynamicglyph').DynamicGlyph;
var Message = require('./message').Message();

//var Entity = function (game, properties) {
var Entity = function (properties) {
	var properties = properties || {};

	//var that = Glyph(properties);
	var that = DynamicGlyph(properties);

	//var name = properties.name || '';
	that.x    = properties.x    || 0;
	that.y    = properties.y    || 0;
	that.z    = properties.z    || 0;
	var map  = null;
	var alive = true;
	var speed = properties.speed || 100;
	
  var sendMessage = function (recipient, message, args) {
		if (recipient.hasMixin('MessageRecipient')) {
			if (args) {
				message = vsprintf(message, args);
			}
			recipient.receiveMessage(message);
		}
	}
	
	that.setX = function (_x) {
		that.x = _x;
	}

	that.setY = function (_y) {
	  that.y = _y;
	}

	that.setZ = function (_z) {
		that.z = _z;
	}

	that.setMap = function (_map) {
		map = _map;
	}

	that.getX = function () {
		return that.x;
	}

	that.getY = function () {
		return that.y;
	}

	that.getZ = function () {
		return that.z;
	}

	that.getMap = function () {
		return map;
	}

	that.setSpeed = function (_speed) {
		speed = _speed;
	}

	that.getSpeed = function () {
		return speed;
	}

	that.setPosition = function (_x, _y, _z) {
		var oldX = that.x;
		var oldY = that.y;
		var oldZ = that.z;

		that.x = _x;
		that.y = _y;
		that.z = _z;
		
		if (map) {
			map.updateEntityPosition(that, oldX, oldY, oldZ);
		}
	}

	that.isPosition = function (_x, _y, _z) {
		return that.x === _x && that.y === _y && that.z === _z;
	}

	//that.tryMove = function(x, y, z, map) {
	that.tryMove = function(x, y, z) {
    var map = that.getMap();
	  var player = map.getPlayer();
		//if (player.getZ() === that.getZ()) { 
		var pZ = player.getZ();
		if (_.contains([pZ-1, pZ, pZ+1], that.getZ())) { //プレイヤーの上下一階までを動かす 
		  var tile = map.getTile(x, y, that.getZ());
		  var target = map.getEntityAt(x, y, that.getZ());
		  if (z < that.getZ()) {
		  	//if (tile != game.stairsUpTile) {
		  	if (tile.getName() !== 'stairsUpTile') {
		  		sendMessage(that, "ここを上がることはできない");
		  	} else {
		  		sendMessage(that, "階段を上がった");
		  		that.setPosition(x, y, z);
		  	}
		  } else if (z >that.getZ()) {
		  	//if (tile != game.stairsDownTile) {
		  	if (tile.getName() !== 'stairsDownTile') {
		  		sendMessage(that, "ここを下りることはできない");
		  	} else {
		  		sendMessage(that, "階段を下りた");
		  	  that.setPosition(x, y, z);
		  	}
		  } else if (target) {
		  	if (that.hasMixin('Attacker') &&
		  			(that.hasMixin('PlayerActor') ||
		  			 target.hasMixin('PlayerActor'))) {
		  		   that.attack(target);
		  			 return true;
		  	}
		  	return false;
      //} else if ((tile.getName() === 'stairsUpTile') && (that.hasMixin('PlayerActor'))) {
      } else if ((tile.getName() === 'stairsUpTile')) {
		    if (map.getEntityAt(x, y, z-1)) {
					sendMessage(that, "何かが道を塞いでいる");
				} else {
		      sendMessage(that, "階段を上った");
		      that.setPosition(x, y, z-1);
				}
		  	return true;
		  //} else if ((tile.getName() === 'stairsDownTile') && (that.hasMixin('PlayerActor'))) {
		  } else if ((tile.getName() === 'stairsDownTile')) {
        if (map.getEntityAt(x, y, z+1)) {
					sendMessage(that, "何かが道を塞いでいる");
				} else {
		      sendMessage(that, "階段を下りた");
		      that.setPosition(x, y, z+1);
				}
		  	return true;
		  } else if (tile.isWalkable()) {
		    that.setPosition(x, y, z);
		  	var items = map.getItemsAt(x, y, z);
		    if (items) {
		  	  if (items.length === 1) {
		  			sendMessage(that, "%sをみつけた", [items[0].describeTotal()]);
		  		} else {
		  			sendMessage(that, "ここにはいくつかのものがある");
		  		}
		  	}
		  			
		  	return true;
		  } else if (tile.isDiggable()) {
		  	if (that.hasMixin('PlayerActor')) {
		  		map.dig(x, y, z);
		  		return true;
		  	}
		  	return false;
		  }
		}
		return false;
	}

	that.isAlive = function () {
		return alive;
	}

	that.kill = function (message) {
		if (!alive) {
			return;
		}
		alive = false;
		if (message) {
			sendMessage(that, message);
		} else {
			sendMessage(that, "あなたは死んだ... -[Enter]-");
		}
		if (that.hasMixin('PlayerActor')) {
			that.act();
		} else {
			that.getMap().removeEntity(that);
		}
	}
		
  return that;
}

module.exports = {
	Entity: Entity
}

},{"./dynamicglyph":4,"./glyph":11,"./message":16}],6:[function(require,module,exports){
"use strict";

var Message = require('./message').Message();

var EntityMixins = (function (){
	var that = {};
	var Entity = require('./entity').Entity;
	var Monsters = require('./monsters').Monsters;
	var Items = require('./items').Items();
	var Dice = require('./dice').Dice();
	
  var sendMessage = function (recipient, message, args) {
		if (recipient.hasMixin(that.MessageRecipient)) {
			if (args) {
				message = vsprintf(message, args);
			}
			recipient.receiveMessage(message);
		}
	}

	var sendMessageNearby = function (map, centerX, centerY, centerZ, message, args) {
		if (args) {
			message = vsprintf(message, args);
		}
		var entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
		var len = entities.length;
		for (var i=0; i<len; i++) {
			if (entities[i].hasMixin(that.MessageRecipient)) {
				entities[i].receiveMessage(message);
			}
		}
	}


	that.PlayerActor = function (game) {
		return {
			name: 'PlayerActor',
		  groupName: 'Actor',
			init: function (_that, template) {
				_that.gold = 0;
				return _that;
			},
			getGold: function () {
				return this.gold;
			},
			setGold: function (gold) {
				this.gold = gold;
			},
		  act: function () {
				if (this.acting) {
					return;
				}
				this.acting = true;
				this.addTurnHunger();
				//this.addTurnHeal();
				//this.levelUp();
				if (!this.isAlive()) {
					game.Screen.playScreen.setGameEnded(true);
				}
			  game.refresh();
			  this.getMap().getEngine().lock();
				//this.clearMessages();
				this.acting = false;
				/*リアルタイム処理
			  this.getMap().getEngine().unlock();
				*/
		  }
		};
	}

	that.FungusActor =  {
		name: 'FungusActor',
		groupName: 'Actor',
		init: function (_that, template) {
			//_that.growthsRemaining = template.growthsRemaining || 5;
			_that.growthsRemaining =  5;
		 return _that;
		},	 
		act: function (){
			if (this.growthsRemaining > 0 && this.getMap().getPlayer().getZ() === this.getZ()) {
				if (Math.random() <= 0.02) {
					var xOffset = Math.floor(Math.random() * 3) -1;
					var yOffset = Math.floor(Math.random() * 3) -1;
					
					if (xOffset != 0 || yOffset != 0) {
						if (this.getMap().isEmptyFloor(this.getX() + xOffset, 
									                         this.getY() + yOffset,
																					 this.getZ())) {
							var monsters = Monsters(this.getZ());
							var entity = monsters.Repository.create(this.getIdName()); 
							var x = this.getX() + xOffset;
							var y = this.getY() + yOffset;
							var z = this.getZ();
							//entity.setPosition(this.getX() + xOffset,
							//                   this.getY() + yOffset,
							//									 this.getZ());
							//this.getMap().addEntity(entity);
							this.getMap().addEntity(x, y, z, entity);
							this.growthsRemaining--;

							sendMessageNearby(this.getMap(),
									entity.getX(), entity.getY(), entity.getZ(),
									'%sは分裂した。 ', [entity.getName()]);

							//this.delMixin(that.FungusActor);
						}
					}
				}
			}
		}
	}

	that.Destructible =  {
		name: 'Destructible',
		init: function (_that, template) {
			_that.hd = template.hd || 0;
      _that.maxHp = template.maxHp || Dice.xdx(_that.hd, 8)();
			_that.hp    = template.hp || _that.maxHp; 
			_that.ac = template.ac || 0;
			_that.maxHealCount = template.healCount || null;
			_that.healCount = template.healCount || null; 
			_that.exp = template.exp + Math.round(_that.hp / 6) || 0; //基礎expにhpの６分の１を加える
			return _that;
		},
		//init: function (template) {
		//	this.maxHp = template.maxHp || 10;
		//	this.hp    = template.hp || _that.maxHp; 
		//	this.defenseValue = template.defenseValue || 0;
		//	this.ac = template.ac || 10; //アーマークラス（AC）
		//},
   	getHp: function () {
			return this.hp;
		},
		getMaxHp: function () {
			return this.maxHp;
		},
		setHp: function (hp) {
			this.hp = hp;
		},
		setMaxHp: function (maxHp) {
			this.maxHp = maxHp;
		},
		getExp: function () {
			return this.exp;
		},
		getAC: function () {
			if (this.hasMixin('Equipper')) {
			  var equipments = this.getAllEquipments();
			  return _.reduce(equipments, function (memo, element) {
					return element ? memo += element.getAC() : memo;
			  }, this.ac);
			} else {
			  return this.ac;
			}
		},
		takeDamage: function (attacker, damage) {
		//takeDamage: function (damage) {
			this.hp -= damage;
			if (this.hp <= 0) {
				if (attacker.hasMixin('Attacker')) {
					attacker.destroy(this);
				}
				//sendMessage(attacker, 'あなたは%sを倒した。 ', [this.getName()]);
				if (this.hasMixin('CorpseDropper')) {
					this.tryDropCorpse();
				}
				this.kill();
			}
		},
	  addTurnHeal: function () {
			if (this.healCount && this.hp < this.maxHp) {
		    this.healCount -= 1;
			  if (this.healCount === 0) {
				  this.hp += 1;
				  this.healCount = this.maxHealCount;
				}
			}
		}
	}

	that.Attacker = {
		name: 'Attacker',
		groupName: 'Attacker',
		init: function (_that, template) {
			_that.damage = template.damage || function () {return 0};
			_that.specials = template.specials || []; //special attack e.) poison, paralysis...etc
		  return _that;
		},
		//init: function (template) {
		//	this.attackValue = template.attackValue || 1;
		//	this.damageDice  = template.damageDice  || 6; //d6
		//	this.attackBonus = template.attackBonus || 0;
		//},
		hitRole: function () {
			return Dice.d20();
		},
		giveDamage: function (target) {
			var damage = this.damage;
			if (this.hasMixin('Equipper') && this.getMainHand()) {
				damage = this.getMainHand().getDamage();
			}
			return (this.hitRole() >= target.getAC()) ? damage() : 0;
		},	
		attack: function (target) {
			if (target.hasMixin('Destructible')) {
				var damage = this.giveDamage(target);
				if (damage > 0) {
					sendMessage(this, 'あなたの攻撃は命中した', [target.getName(), damage]);
					sendMessage(target, '%sの攻撃は命中した', [this.getName(), damage]);
				  target.takeDamage(this, damage);
				  //_.each(this.special, function (val, ind, obj) {
					//	val(target);
					//});
				} else {
          sendMessage(this, 'あなたの攻撃は外れた。 ');
					sendMessage(target, '%sの攻撃は外れた。 ', [this.getName()]);
				}
			}
		},
		destroy: function (target) {
			if (this.hasMixin('PlayerActor')) {
				this.addExp(target.getExp());
        sendMessage(this, '%sを倒した。 ', [target.getName()]);
			}
		},
		poison: function (target) {
			if (target.hasMixin('PlayerActor')) {
			}
		}
	}

	that.SimpleAttacker = {
		name: 'SimpleAttacker',
		groupName: 'Attacker',
		attack: function (target) {
			if (target.hasMixin('Destructible')) {
				target.takeDamage(this, 1);
			}
		}
	}
		
	that.MessageRecipient = {
		name: 'MessageRecipient',
    init: function (_that, template) {
			//_that.messages = [];
			return _that;
		},
		//init: function (template) {
		//	this.messages = [];
		//},
    messages: (function () {
			var messages = [];
			return function (_messages) {
				if (_messages) { messages = _messages; }
				return messages;
			}
		})(),
		receiveMessage: function (message) {
			var messages = this.messages();
			messages.push(message);
			this.messages(messages);
			//this.messages.push(message);
		},
		getMessage: function () {
			var messages = this.messages();
			var message = '%c{white}%b{#1C1C1C}';
			if (!_.isEmpty(messages)) {
			  message += _.first(messages);
			  if (!_.isEmpty(_.rest(messages))) {
			  	message += "-[more]-";
			  }
			} else {
				message += "";
			}
			return message;
		},
		//getMessages: function () {
		//	return this.messages();
		//	//return this.messages;
		//},
		clearMessages: function () {
			var messages = [];
			this.messages(messages);
			//this.messages = [];
		},
	}
	
	that.Sight = {
		name: 'Sight',
		groupName: 'Sight',
    init: function(_that, template) {
			_that.sightRadius = template.sightRadius || 20; //1;//5;
			return _that;
		},
		//init: function(template) {
		//	this.sightRadius = template.sightRadius || 10;//5;
		//},
		getSightRadius: function() {
		  return this.sightRadius;
		},
		canSee: function (entity) {
			if (!entity || this.getMap() !== entity.getMap() || this.getZ() !== entity.getZ()) {
				return false;
			}

      var otherX = entity.getX();
      var otherY = entity.getY();

      if ((otherX - this.getX()) * (otherX - this.getX()) +
          (otherY - this.getY()) * (otherY - this.getY()) >
          this.sightRadius * this.sightRadius) {
          return false;
      }

      var found = false;
      this.getMap().getFov(this.getZ()).compute(
          this.getX(), this.getY(), 
          this.getSightRadius(), 
          function(x, y, radius, visibility) {
              if (x === otherX && y === otherY) {
                  found = true;
              }
          });
      return found;
    }

	}

	that.WanderActor = {
		name: 'WanderActor',
		groupName: 'Actor',
		act: function() {
			var moveOffset = (Math.round(Math.random()) === 1) ? 1: -1;
			if (Math.round(Math.random()) === 1) {
				this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
			} else {
				this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
			}
		}
	}

	that.InventoryHolder = {
		name: 'InventoryHolder',
		init: function (_that, template) {
			//var inventorySlots = template.inventorySlots || 10; //10;
			//_that.items = new Array(inventorySlots);
			_that.inventorySlots = template.inventorySlots || 20; //10; //10;
			_that.items = []; 
			_that.itemsTotal = 0;
			return _that;
		},
		getItems: function () {
			return this.items; 
		},
		getItem: function (i) {
			return this.items[i];
		},
		getItemNum: function () {
			return this.itemNum;
		},
		addItem: function (item) {
			//for (var i = 0; i < this.items.length; i++) {
			if (this.canAddItem()) {
			  for (var i = 0; i < this.inventorySlots; i++) {
			  	if (!this.items[i]) {
			  		this.items[i] = item;
			  		//this.itemNum = i;
			      this.itemsTotal = this.itemsTotal + item.getNumber();
			  		return true;
			  	} else { //同名のアイテムは所持数を増やす
			  		//if (this.items[i].describe() === item.describe()) {
			  		if (this.items[i].identity() === item.identity()) {
			  			var num = this.items[i].getNumber() + item.getNumber();
			  			this.items[i].setNumber(num);
			        this.itemsTotal = this.itemsTotal + item.getNumber();
			  			return true;
			  		}
			  	}
			  }
			} else {
			  return false;
			}
		},
		removeItem: function (i) {
			this.itemsTotal--;
			if (this.items[i] && this.hasMixin('Equipper')) {
				//this.unequip(this.items[i]);
			}
			var num = this.items[i].getNumber() -1;
			this.items[i].setNumber(num);
			if (this.items[i].getNumber() <= 0) {
				//this.items[i] = null;
				this.items.splice(i, 1);
			}
		},
		canAddItem: function () {
			return (this.itemsTotal < this.inventorySlots); 
			//for (var i = 0; i< this.items.length; i++) {
			//	if (!this.items[i]) {
			//		return true;
			//	}
			//}
		},
		pickupItems: function (map, indices) {
			var mapItems = map.getItemsAt(this.getX(), this.getY(), this.getZ());
			var added = 0;
			for (var i = 0; i < indices.length; i++) {
				if (this.addItem(mapItems[indices[i] - added])) {
					mapItems.splice(indices[i] - added, 1);
					added++;
				} else {
					break;
				}
			}
			map.setItemsAt(this.getX(), this.getY(), this.getZ(), mapItems);
			return added === indices.length;
		},
		dropItem: function (map, i, num) {
			var num = num || 1;
			if (this.items[i]) {
				if (map) {
					//捨てるときは捨てるアイテムブジェクトをコピーしたものをマップに置く
					var item = this.items[i].copy();
					//捨てる数を設定
					item.setNumber(num);
					//マップに置く
					map.addItem(this.getX(), this.getY(), this.getZ(), item);
				}
				//捨てた数だけアイテムリストから取り除く
				for (var n=0; n<num; n++) {
				  this.removeItem(i);
				}
			}
		},
		changeName: function (i, newName, num) {
			var num = num || 1;
			//アイテムのオブジェクトをコピーして名前を変更する
			var item = this.items[i].copy();
			item.setName(newName);
			for (var n=0; n<num; n++) {
				this.addItem(item);
				this.removeItem(i);
			}
			return item;
		},
		clearItems: function () {
			this.items = [];
		}
	}

	that.FoodConsumer = {
		name: 'FoodConsumer',
		init: function (_that, template) {
			_that.maxFullness = template.maxFullness || 2000;
			_that.fullness    = template.fullness    || 900;//1250;
			_that.fullnessDepletionRate = template.fullnessDepletionRate || 1;
			return _that;
		},
		addTurnHunger: function () {
		  this.modifyFullnessBy(this.fullnessDepletionRate * -1);
		},
		modifyFullnessBy: function (points) {
			if (this.fullness <= 0) {
				this.kill("あなたは餓死した...");
			} else if (this.fullness > this.maxFullness && points > 0) {
				this.kill("あなたは食べ過ぎて倒れた...");
			}
			this.fullness = this.fullness + points;
	  },
		getHungerState: function () {
			var perPercent = this.maxFullness / 100;
			if (this.fullness <= perPercent * 1) {
				return '瀕死';
			} else if (this.fullness <= perPercent * 7.5) {
				return '飢餓';
			} else if (this.fullness <= perPercent * 15) {
				return '空腹';
			} else if (this.fullness >= perPercent * 90) {
				return '満腹';
			} else {
				return '';
			}
		}
	}

	that.CorpseDropper = {
		name: 'CorpseDropper',
		init: function(_that, template) {
			_that.corpseDropRate = template['corpseDropRate'] || 100;
			return _that;
		},
		tryDropCorpse: function() {
			if (Math.round(Math.random() * 100) < this.corpseDropRate) {
				var map = this.getMap();
				map.addItem(this.getX(), this.getY(), this.getZ(),
				  Items.Repository.create('corpse', {
				  	name: this.getName() + 'の死体',
				  	foreground: this.getForeground()
				  }));
			}
		}
	}

	that.Equipper = {
		name: 'Equipper',
		init: function(_that, template) {
			_that.mainHand = null;
			_that.subHand = null;
			_that.armor = null;
			_that.shield = null;
			_that.setMainHand = this.set('mainHand');
			_that.setSubHand  = this.set('subHand');
			_that.setArmor    = this.set('armor');
			_that.setShield   = this.set('shield');
			return _that;
		},
    //wieldHand: function (hand) {
		set: function (part) {
			return function (item) {
			  if (this[part]) {
					this.unset(part);
			  }
			  this[part] = item;
			}
		},
		//unwieldHand: function (hand) {
		unset: function (part) {
			this[part].setEquipState(false);
			this[part] = null;
		},
		equip: function (item) {
			if (item.getType() === 'weapon') {
			  this.wield(item);
			} else {
			  this.wear(item);
			}	
		},
		wield: function (item) {
			if ((item !== this.mainHand) && (item !== this.subHand)) {
				item.setEquipState(true);
			  if (item.twoHand) {
			  	this.setShield(null);
			  }
				this.setMainHand(item);
			}
		},
		wear: function (item) {
			var type = item.getType();
			item.setEquipState(true);
			if (this[type]) {
				this.takeOff(type);
			}
			this[type] = item;
			//this.armor = item;
		},
		takeOff: function (type) {
			this[type].setEquipState(false);
			this[type] = null;
			//this.armor = null;
		},
		getMainHand: function () {
			return this.mainHand;
		},
		getSubHand: function () {
			return this.subHand;
		},
		getArmor: function () {
			return this.armor;
		},
		getAllEquipments: function () {
			return [
				this.mainHand,
				this.subHand,
				this.armor,
				this.shield
			];
		},
		unequip: function (item) {
			if (this.mainHand === item) {
				this.unwieldRight();
			} 
			if (this.subHand === item) {
				this.unwieldLeft();
			} 
			if (this.armor === item) {
				this.takeOff();
			} 
		}
	}

	that.TaskActor = {
    name: 'TaskActor',
    groupName: 'Actor',
    init: function(_that, template) {
      _that.tasks = template['tasks'] || ['wander']; 
			_that.territory = template['territory'] || 20;
			_that.warning = false;
			return _that;
		},
    act: function() {
			var player = this.getMap().getPlayer();
			var z = this.getZ();
			if (z >= player.getZ()-1 && z <= player.getZ()+1) {
        for (var i = 0; i < this.tasks.length; i++) {
          if (this.canDoTask(this.tasks[i])) {
            this[this.tasks[i]]();
            return;
          }
        }
			}
    },
		//テリトリー内にプレイヤーがいるかどうか(上下階は周囲5マスに階段があるとき）
		withinTerritory: function () {
			var x = this.getX();
			var y = this.getY();
			var z = this.getZ();
			var map = this.getMap();
			var player = map.getPlayer();
			return map.isEntityWithinRadius(x, y, z, this.territory, player) 
			    || !_.isEmpty(map.getEquipmentsWithinRadius(x, y, z, 5, 'Stairs')); 
		},
    canDoTask: function(task) {
      if (task === 'hunt') {
        //return this.hasMixin('Sight') && this.canSee(this.getMap().getPlayer());
				return this.withinTerritory();
      } else if (task === 'wander') {
        return true;
      } else {
        throw new Error('Tried to perform undefined task ' + task);
      }
    },
    hunt: function() {
			const depthTerritory = 5;
			var map    = this.getMap();
      var player = map.getPlayer();

      var offsets = Math.abs(player.getX() - this.getX()) + 
                    Math.abs(player.getY() - this.getY());
      if (offsets === 1 && this.getZ() === player.getZ()) {
        if (this.hasMixin('Attacker')) {
          this.attack(player);
          return;
        }
      }

			var target = player; 
			//var stairs = null;
			//if (this.getZ() > player.getZ()) {
			//  var equipments = map.getEquipmentsWithinRadius(this.getX(), this.getY(), this.getZ(), depthTerritory);
			//	stairs = _.find(equipments, function (value, key) {
			//		return value.hasMixin('UpStairs');
			//	});
			//	
			//} else 
			//if (this.getZ() < player.getZ()) {
			//  var equipments = map.getEquipmentsWithinRadius(this.getX(), this.getY(), this.getZ(), depthTerritory);
			//	stairs = _.find(equipments, function (value, key) {
			//		return value.hasMixin('DownStairs');
			//	});
			//}
      //if (stairs) {
			//	target = stairs;
			//}
			//
			//if (target !== player) {
			//	//階段上にいる場合に階層移動
			//	var tile = map.getTile(this.getX(), this.getY(), this.getZ()); 
			//	if (tile.getName() === "stairsDownTile") {
			//		this.tryMove(this.getX(), this.getY(), this.getZ()+1);
			//	} else 
			//	if (tile.getName() === "stairsUpTile") {
			//		this.tryMove(this.getX(), this.getY(), this.getZ()-1);
			//	}
			//	//階段のとなりにいる場合に階段上に移動
			//	var equipments = map.getEquipmentsWithinRadius(this.getX(), this.getY(), this.getZ(), 1);
			//	var stairs = _.find(equipments, function (value, key) {
			//		return value.hasMixin('Stairs');
			//	});
			//	if (stairs) {
			//		this.tryMove(stairs.getX(), stairs.getY(), stairs.getZ());
			//	}
			//}

      var source = this;
      var z = source.getZ();
      //var path = new ROT.Path.AStar(player.getX(), player.getY(), function(x, y) {
      var path = new ROT.Path.AStar(target.getX(), target.getY(), function(x, y) {
        var entity = source.getMap().getEntityAt(x, y, z);
        if (entity && entity !== player && entity !== source) {
          return false;
        }
        return source.getMap().getTile(x, y, z).isWalkable();
      }, {topology: 4});
      var count = 0;
      path.compute(source.getX(), source.getY(), function(x, y) {
        if (count == 1) {
          source.tryMove(x, y, z);
        }
        count++;
      });
    },
    wander: function() {
      var moveOffset = (Math.round(Math.random()) === 1) ? 1 : -1;
      if (Math.round(Math.random()) === 1) {
        this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
      } else {
        this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
      }
    }
  }

	//遠距離攻撃するもの
	that.FireAttacker = {
    name: 'FireAttacker',
		init: function(_that, template) {
			_that.isLoaded   = template['isLoaded']   || false;
			_that.fireDamage = template['fireDamage'] || 0; 
			_that.fireRange  = template['fireRange']  || 0;
			_that.fireNum    = template['fireNum']    || 0;
			return _that;
		},
		loadFire: function (damage, range, num) {
		},
		tryFire: function() {
			if (this.isLoaded) {
			}
		}

	}

	return that;
})();

module.exports = {
	EntityMixins: EntityMixins
}

},{"./dice":3,"./entity":5,"./items":14,"./message":16,"./monsters":17}],7:[function(require,module,exports){
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



},{"./entity":5}],8:[function(require,module,exports){
"use strict";


var EquipmentMixins = (function (){
	var that = {};
  var Message = require('./message').Message();
	var Dice = require('./dice').Dice();

	that.UpStairs = {
		name: 'UpStairs',
		groupName: 'Stairs',
		init: function (_that, template) {
			return _that;
		},
		trigger: function (entity) {
			//var x = entity.getX();
			//var y = entity.getY();
			//var z = entity.getZ();
			//var map = entity.getMap();
      //if (map.getEntityAt(x, y, z-1)) {
			//	Message.sendMessage(entity, "何かが道を塞いでいる");
			//} else {
		  //  Message.sendMessage(entity, "あなたは階段を上った");
		  //  entity.setPosition(x, y, z-1);
			//}
		}
	}

  that.DownStairs = {
		name: 'DownStairs',
		groupName: 'Stairs',
    init: function (_that, template) {
			return _that;
		},
		trigger: function (entity) {
			//var x = entity.getX();
			//var y = entity.getY();
			//var z = entity.getZ();
			//var map = entity.getMap();
      //if (map.getEntityAt(x, y, z+1)) {
			//	Message.sendMessage(entity, "何かが道を塞いでいる");
			//} else {
		  //  Message.sendMessage(entity, "あなたは階段を下りた");
		  //  entity.setPosition(x, y, z+1);
			//}
		}
	}

	that.RockTrap = {
		name: 'RockTrap',
		groupName: 'Trap',
		init: function (_that, template) {
			_that.damage = Dice.xdx(1,8);
		  _that.message = '天井の落し扉が開き、石があなたの頭に落ちてきた!'	
		 return _that;
		},	 
		trigger: function (entity){
			var avoidance = false;
			if (entity.hasMixin('PlayerActor')) {
				avoidance = entity.saveVs('luc');
			}
			Message.sendMessage(entity, this.message);
			if (!avoidance) {
				Message.sendMessage(entity, '石はあなたの頭に直撃した!');
			  entity.takeDamage(this, this.damage());
			} else {
				Message.sendMessage(entity, '石はあなたのあたまをかすめた!');
			}
		}
	}

	return that;
})();

module.exports = {
	EquipmentMixins: EquipmentMixins
}


},{"./dice":3,"./message":16}],9:[function(require,module,exports){
'use strict'

var Repository = require('./repository').Repository;
var Equipment = require('./equipment').Equipment;
var Dice = require('./dice').Dice();

var Equipments = function() {
	var that = {};
	var Mixins = require('./equipmentmixins').EquipmentMixins;

	that.Repository	= Repository('equipments', Equipment);
	
  that.Repository.define('upStairs', {
		name: '上り階段',
		character: '<',
		mixins: [Mixins.UpStairs]
	}, {
		disableRandomCreation: true
	});

  that.Repository.define('downStairs', {
		name: '下り階段',
		character: '>',
		mixins: [Mixins.DownStairs]
	}, {
		disableRandomCreation: true
	});

	that.Repository.define('rockTrap', {
		name: '落石の罠',
		character: '^',
		foreground: 'darkgoldenrod',
		mixins: [Mixins.RockTrap]	
	});
	
	return that;
}

module.exports = {
  Equipments: Equipments	
}


},{"./dice":3,"./equipment":7,"./equipmentmixins":8,"./repository":18}],10:[function(require,module,exports){
"use strict";


var Game = (function () {
	var that = {};
	var Screen = require('./screens').Screen;
	var Glyph  = require('./glyph').Glyph;
	var Tile   = require('./tile').Tile;
	var Mixins = require('./entitymixins').EntityMixins;
	var Monsters = require('./monsters').Monsters;
	var Dice = require('./dice').Dice();
	var currentScreen = null;
	var message = "";

  var dom = {};
  that.defBackground = "#1C1C1C";
  
	that.display = null;
  that.Screen = Screen(that);

	that.PlayerTemplate = {
		character: '@',
		foreground: 'white',
		background: that.defBackground,
		maxHp: 10,
		attackValue: 3,
		defenseValue: 3,
		damage: Dice.xdx(1, 2),
		ac: 9,
		//speed: 110,
		sightRadius: 6, //20, //6, //5,//10, //6,
		healCount: 15,
		mixins: [Mixins.PlayerActor(that),
		         Mixins.Attacker, Mixins.Destructible,
						 Mixins.InventoryHolder, Mixins.FoodConsumer,
		         Mixins.Sight, Mixins.MessageRecipient,
		         Mixins.Equipper]
	}
	
	that.map = Map;

	that.screenWidth = 36;//32; //75; //80;
	that.screenHeight = 16;//16; //35;//42; //40; //24;

	that.getScreenWidth  = function () { return that.screenWidth; }
	that.getScreenHeight = function () { return that.screenHeight; }
				
	that.init = function(tileSet) {
    var tileSet = document.getElementById('tileSet'); 
   
		var tw = 15;
		var th = 15;
    var options = {
        layout: "tile",
        bg: that.defBackground, //"#222",//"black",
        tileWidth: tw,
        tileHeight: th,
        tileSet: tileSet ,
        tileMap: {
					  "	": [tw*64,  th*64 ],
					  " ": [tw*64,  th*64 ],
            "@": [tw*0,  th*4 ],
						".": [tw*14, th*2 ],
						"+": [tw*11, th*2 ],
						"░": [tw*0,  th*11],
						">": [tw*14, th*3 ],
						"<": [tw*12, th*3 ],
            "│": [tw*3,  th*11],
            "─": [tw*4,  th*12],
            "┘": [tw*9,  th*13],
            "└": [tw*0,  th*12],
            "┐": [tw*15, th*11],
            "┌": [tw*10, th*13],
						"♠": [tw*6,  th*0 ],
						"‼️": [tw*3,  th*1 ],
						"■": [tw*14, th*15],
						//"F": [tw*, th*],
						//"p": [tw*, th*],
						//"r": [tw*, th*],
						//"k": [tw*, th*],
            //"B": [tw*2,  th*5 ]
						//"o": [tw*, th*],
        },
				tileColorize: true,
        width: that.screenWidth,
        height: that.screenHeight//+2
    }
		var index = 32;
		for (var w=0; w<16; w++) {
			options.tileMap[String.fromCharCode(index)] = [tw*w, th*2];
			index++;
		}
		var index = 64;
		for (var h=4; h<8; h++) {
	  	for (var w=0; w<16; w++) {
				options.tileMap[String.fromCharCode(index)] = [tw*w, th*h];
				index++;
			}
		}
		options.tileMap['!'] = [tw*13, th*10];

		//var options2 = {bg: "#1C1C1C", width: 125, height: 2, fontSize: 18};
		//var options3 = {bg: "#1C1C1C", width: 125, height: that.screenHeight, fontSize: 18};
		var options2 = {bg: that.defBackground, width: 80, height: 2, /*spacing: 1.2,*/ fontSize: 18};
		var options3 = {bg: that.defBackground, width: 80, height: 21, /*spacing: 1.2,*/ fontSize: 18};
		//var options2 = {bg: "#1C1C1C", width: 62, height: 2, fontFamily: "Nico Moji", spacing: 1.2, fontSize: 18};
		//var options3 = {bg: "#1C1C1C", width: 62, height: 20, fontFamily: "Nico Moji", spacing: 1.2, fontSize: 18};

    //that.display = new ROT.Display({width: that.screenWidth, height: that.screenHeight+2});
		that.display = {};
    that.display.message = new ROT.Display(options2);
    //that.display.main = new ROT.Display(options);
    that.display.main = new ROT.Display({fontSize: 32, bg: that.defBackground, width: that.screenWidth, height: that.screenHeight+2});
    that.display.menu = new ROT.Display(options3);
    that.display.sub = new ROT.Display(options2);
		
	  var bindEventToScreen = function(event) {
	    window.addEventListener(event, function(e) {
	      if (currentScreen !== null) {
	        currentScreen.handleInput(event, e);
	      }
	    });

    }
	  bindEventToScreen('keydown');
	  bindEventToScreen('keypress');

    dom.message = document.body.appendChild(that.getDisplay("message").getContainer());
    dom.main    = document.body.appendChild(that.getDisplay("main").getContainer());
    dom.menu    = document.body.appendChild(that.getDisplay("menu").getContainer());
    dom.sub     = document.body.appendChild(that.getDisplay("sub").getContainer());
	  dom.main.style.display = "none";
    dom.menu.style.display = "none";

		that.getDisplay().clear();
		//$('.screen').append(that.getDisplay().getContainer());
    that.switchScreen(that.Screen.startScreen);
	}

	that.getDisplayDom = function (type) {
		return dom[type];
	};
  
	that.refresh = function () {
		that.getDisplay().clear();
		that.getDisplay("message").clear();
		that.getDisplay("menu").clear();
		that.getDisplay("sub").clear();
		currentScreen.render(that.getDisplay());
	}

	that.getDisplay = function(type) {
		type = type || "main";
		return that.display[type];
		//return that.display;
	}

	that.switchScreen = function(screen) {
	  if (currentScreen !== null) {
	    currentScreen.exit();
	  }
	  that.getDisplay().clear();

	  currentScreen = screen;
	  if (!currentScreen !== null) {
	    currentScreen.enter();
			that.refresh();
	  }
	}

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
	
	return that;
})();

Game.init();





},{"./dice":3,"./entitymixins":6,"./glyph":11,"./monsters":17,"./screens":19,"./tile":20}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
'use strict'

var Glyph = require('./glyph').Glyph;
var DynamicGlyph = require('./dynamicglyph').DynamicGlyph;

var Item = function(properties) {
	var properties = properties || {};
	//var that = Glyph(properties);
	var that = DynamicGlyph(properties);

	that.superDescribe = that.describe;

	var maxNumber = properties['maxNumber'] || 1;
	var number = Math.floor(Math.random () * maxNumber) + 1;
	var unit = properties['unit'] || 'つ';

	that.describe = function () {
    var describe = that.superDescribe();
		//if (equipState) { describe += '(装備している)'; }
		if (that.hasMixin('Equippable')) {
		  if (that.getEquipState()) { describe += '(装備している)'; }
		}
		return describe;
	}

	//アイテムの同一性（この値が等しいなら同じアイテムであるということ）
	that.identity = function () {
		return that.describe();
	}

	that.describeTotal = function () {
		if (number > 1) {
			return number + unit + 'の' + that.describe();
		} else {
			return that.describe();
		}
	}

	that.getNumber = function() {
		return number;
	}

	that.setNumber = function (_number) {
		number = _number;
	}

	that.getUnit = function () {
		return unit;
	}

	
	that.copy = function () {
		var item = Item(properties);
		item.setName(that.getName());
		item.setForeground(that.getForeground());
		return item; 
	}

	return that;
}

module.exports = {
	Item: Item
}



},{"./dynamicglyph":4,"./glyph":11}],13:[function(require,module,exports){
var ItemMixins = (function () {
	var that = {};

	that.Edible = {
		name: 'Edible',
		init: function (_that, template) {
			_that.foodValue = template.foodValue || 5;
			_that.maxConsumptions = template.consumptions || 1;
			_that.remainingConsumptions = _that.maxConsumptions;
			return _that;
		},
		eat: function (entity) {
			if (entity.hasMixin('FoodConsumer')) {
				if (this.hasRemainingConsumptions()) {
					entity.modifyFullnessBy(this.foodValue);
					//this.remainingConsumptions--;
				}
			}
		},
		hasRemainingConsumptions: function () {
			return this.remainingConsumptions > 0;
		},
		describe: function () {
			if (this.maxConsumptions != this.remainingConsumptions) {
				return '食べかけの' + this.super_describe();
			} else {
				return this.getName();
			}
		}
	}

	that.Equippable = {
		name: 'Equippable',
		init: function (_that, template) {
			_that.type = template.type || "weapon";
	    _that.equipState = false;
			_that.attackValue = template.attackValue || 0;
			_that.attackBonus = template.attackBonus || 0;
			_that.defenseValue = template.defenseValue || 0;
			_that.damage = template.damage || 0;
			_that.ac = template.ac || 0;
			_that.wieldable = template.wieldable || false;
			_that.wearable = template.wearable || false;
			_that.twoHand = template.twoHand || false;
			return _that;
		},
		getType: function () {
			return this.type;
		},
		getEquipState: function () {
  		return this.equipState;
  	},
  	setEquipState: function (_equipState) {
  		this.equipState = _equipState;
  	},
		describe: function () {
			var name = this.getName();
			if (this.getEquipState()) { name += "(装備している)"; }
		  return name;
	  },
		getAttackValue: function () {
			return this.attackValue;
		},
		getAttackBonus: function () {
			return this.attackBonus;
		},
		getDefenseValue: function () {
			return this.defenseValue;
		},
		getDamage: function () {
			return this.damage;
		},
		getAC: function () {
			return this.ac;
		},
		isWieldable: function () {
			return this.wieldable;
		},
		isWearable: function () {
			return this.wearable;
		},
		isTwoHand: function () {
			return this.twoHand;
		}
	}
	
	return that;
})();

module.exports = {
	ItemMixins: ItemMixins
}


},{}],14:[function(require,module,exports){
'use strict'

var Repository = require('./repository').Repository;
var Item = require('./item').Item;
var Dice = require('./dice').Dice();

var Items = function() {
	var that = {};
	var Mixins = require('./itemmixins').ItemMixins;

	that.Repository	= Repository('items', Item);

  that.Repository.define('coins', {
		name: '金貨',
		character: '$',
		foreground: 'yellow',
		maxNumber: 5,
		unit: '枚'
	});

	that.Repository.define('food', {
		name: '食料',
		character: '%',
		foreground: 'darkgoldenrod',
		foodValue: 800,
		unit: 'つ',
		mixins: [Mixins.Edible]	
	});

  that.Repository.define('fuel', {
		name: '燃料',
		character: '!',
		foreground: 'orange',
		unit: '本'
	});
	
	that.Repository.define('rock', {
		name: '岩',
		character: '*',
		foreground: 'white'
	});

  that.Repository.define('blueFungi', {
		name: 'アオキノコ',
		character: '♠',
		foreground: 'RoyalBlue'
	});

  that.Repository.define('nitroFungi', {
		name: 'ニトロダケ',
		character: '♠',
		foreground: 'Crimson'
	});

	that.Repository.define('numbFungi', {
		name: 'マヒダケ',
		character: '♠',
		foreground: 'Yellow'
	});

  that.Repository.define('poisonFungi', {
		name: 'ドクテングダケ',
		character: '♠',
		foreground: 'BlueViolet'
	});

  that.Repository.define('Herb', {
		name: '薬草',
		character: '‼️',
		foreground: 'LawnGreen'
	});
	
	that.Repository.define('fireHerb', {
		name: '火薬草',
		character: '‼️',
		foreground: 'Crimson'
	});

	that.Repository.define('corpse', {
		name: '死体',
		character: '%',
		foodValue: 200,
		consumptions: 1,
		mixins: [Mixins.Edible]
	}, {
		disableRandomCreation: true
	});

	//武器
	that.Repository.define('dagger', {
		name: '短剣',
		character: ')',
		foreground: 'gray',
		attackValue: 2,
		damage: Dice.xdx(1, 4),
		wieldable: true,
		mixins: [Mixins.Equippable]
	}, {
		disableRandomCreation: true
	});

  that.Repository.define('shortSword', {
		name: '小剣',
		character: ')',
		foreground: 'silver',
		attackValue: 3,
		damage: Dice.xdx(2, 4),
		wieldable: true,
		mixins: [Mixins.Equippable]
	}, {
		disableRandomCreation: true
	});

  that.Repository.define('twoHandedSword', {
		name: '両手剣',
		character: ')',
		foreground: 'silver',
		attackValue: 5,
		attackBonus: 4,
		damage: Dice.xdx(1, 12),
		wieldable: true,
		twoHand: true,
		mixins: [Mixins.Equippable]
	}, {
		disableRandomCreation: true
	});

  that.Repository.define('spear', {
		name: '槍',
		character: ')',
		foreground: 'SaddleBrown',
		attackValue: 4,
		defenseValue: 3,
		damage: Dice.xdx(1, 8),
		wieldable: true,
		twoHand: true,
		mixins: [Mixins.Equippable]
	}, {
		disableRandomCreation: true
	});
	
	//防具
  that.Repository.define('leatherArmor', {
		type: 'armor',
		name: '革の鎧',
		character: '[',
		foreground: 'SaddleBrown',
		//defenseValue: 3,
		ac: 2,
		wearable: true,
		mixins: [Mixins.Equippable]
	}, {
		disableRandomCreation: true
	});

	that.Repository.define('smallShield', {
		type: 'shield',
		name: '小さな盾',
		character: '[',
		foreground: 'SaddleBrown',
		ac: 1,
		wearable: true,
		mixins: [Mixins.Equippable]
	}, {
		disableRandomCreation: true
	});

	that.Repository.define('mithrilCloth', {
		type: 'armor',
		name: 'ミスリル服',
		character: '[',
		foreground: 'Aquamarine',
		//defenseValue: 12,
		ac: 6,
		wearable: true,
		mixins: [Mixins.Equippable]
	}, {
		disableRandomCreation: true
	});

	return that;
}

module.exports = {
	Items: Items
}



},{"./dice":3,"./item":12,"./itemmixins":13,"./repository":18}],15:[function(require,module,exports){
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
				//  that.addEquipmentAtRandomPosition(Equipments().Repository.createRandom(), z);
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

},{"./dice":3,"./entity":5,"./equipments":9,"./items":14,"./monsters":17,"./tiles":21}],16:[function(require,module,exports){
var Message = function () {
	var that = {};

  that.sendMessage = function (recipient, message, args) {
		if (recipient.hasMixin("MessageRecipient")) {
			if (args) {
				message = vsprintf(message, args);
			}
			recipient.receiveMessage(message);
		}
	}

	that.sendMessageNearby = function (map, centerX, centerY, centerZ, message, args) {
		if (args) {
			message = vsprintf(message, args);
		}
		var entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
		var len = entities.length;
		for (var i=0; i<len; i++) {
			if (entities[i].hasMixin(that.MessageRecipient)) {
				entities[i].receiveMessage(message);
			}
		}
	}

	return that;
}

module.exports = {
	Message: Message
}


},{}],17:[function(require,module,exports){
"use strict";

//var Monsters = function (game) {
var Monsters = function (depth) {
	var that = {};

  var Repository = require('./repository').Repository;
  var Entity = require('./entity').Entity;
  var Mixins = require('./entitymixins').EntityMixins;
	var Dice = require('./dice').Dice();

 	//that.Repository = Repository('monsters', Entity);
 	that.Repository = Repository('monsters', Entity, function(template) {
		var floor = template.floor.split("-");
    return (depth+1 >= floor[0] && depth+1 <= floor[1]);
	});
	
	that.Repository.define('Kobold', {
		name: 'コボルド',
		character: 'K',
		foreground: 'dodgerblue',
		hd: 1,
		ac: 11,
		floor: '1-6',
		damage: Dice.xdx(1,4),
		exp: 1,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]

	});

  that.Repository.define('Jackal', {
		name: 'ジャッカル',
		character: 'J',
		foreground: 'olive',
		hd: 1,
		ac: 11,
		floor: '1-7',
		damage: Dice.xdx(1,2),
		exp: 2,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('OilBeetle', {
		name: 'オイルビートル',
		character: 'B',
		foreground: 'orange',
		hd: 1,
		ac: 15,
		floor: '1-8',
		damage: Dice.xdx(1,2),
		exp: 1,
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.CorpseDropper]
	});

	that.Repository.define('Snake', {
		name: 'スネーク',
		character: 'S',
		foreground: 'ForestGreen',
		hd: 1,
		ac: 13,
		floor: '1-9',
		damage: Dice.xdx(1,3),
		exp: 2,
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.CorpseDropper]
	});

  that.Repository.define('Hobgoblin', {
		name: 'ホブゴブリン',
		character: 'H',
		foreground: 'lightgrey',
		hd: 1,
		ac: 13,
		floor: '1-10',
		damage: Dice.xdx(1,8),
		exp: 3,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('FloatingEye', {
		name: 'フローティングアイ',
		character: 'E',
		foreground: 'white',
		hd: 1,
		ac: 9,
		floor: '2-11',
		exp: 5,
		tasks: ['wander'],
		mixins: [Mixins.TaskActor, Mixins.Destructible,
			       Mixins.CorpseDropper]
	});
	
  that.Repository.define('GiantAnt', {
		name: 'ジャイアントアント',
		character: 'A',
		foreground: 'red',
		hd: 2,
		ac: 15,
		floor: '3-12',
		damage: Dice.xdx(1,6),
		exp: 9,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Orc', {
		name: 'オーク',
		character: 'O',
		foreground: 'grey',
		hd: 1,
		ac: 12,
		floor: '4-13',
		damage: Dice.xdx(1,8),
		exp: 5,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Zombie', {
		name: 'ゾンビ',
		character: 'Z',
		foreground: 'purple',
		hd: 2,
		ac: 10,
		floor: '5-14',
		damage: Dice.xdx(1,8),
		exp: 6,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Gnome', {
		name: 'ノーム',
		character: 'G',
		foreground: 'white',
		hd: 1,
		ac: 13,
		floor: '6-15',
		damage: Dice.xdx(1,6),
		exp: 7,
		tasks: ['wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Leprechaun', {
		name: 'レプラコーン',
		character: 'L',
		foreground: 'gold',
		hd: 3,
		ac: 10,
		floor: '7-16',
		damage: Dice.xdx(1,1),
		exp: 10,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Centaur', {
		name: 'ケンタウルス',
		character: 'C',
		foreground: 'skyblue',
		hd: 4,
		ac: 14,
		floor: '8-17',
		damage: function () { return Dice.xdx(1,6)() + Dice.xdx(1,6)(); },
		exp: 15,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('RustMonster', {
		name: 'ラストモンスター',
		character: 'R',
		foreground: 'Firebrick',
		hd: 5,
		ac: 16,
		floor: '9-18',
		damage: function () { return 0; },
		exp: 20,
		tasks: ['wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Quasit', {
		name: 'クアジット',
		character: 'Q',
		foreground: 'green',
		hd: 3,
		ac: 16,
		floor: '10-19',
		damage: function () { return Dice.xdx(1,2)() + Dice.xdx(1,2)() + Dice.xdx(1,4)(); },
		exp: 32,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Nymph', {
		name: 'ニンフ',
		character: 'N',
		foreground: 'Wheat',
		hd: 3,
		ac: 9,
		floor: '11-20',
		damage: function () { return 0; },
		exp: 37,
		tasks: ['wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Yeti', {
		name: 'イエティ',
		character: 'Y',
		foreground: 'LightBlue',
		hd: 4,
		ac: 12,
		floor: '12-21',
		damage: function () { return Dice.xdx(1,6)() + Dice.xdx(1,6)(); },
		exp: 50,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Troll', {
		name: 'トロール',
		character: 'T',
		foreground: 'DarkGray',
		hd: 6,
		ac: 14,
		floor: '13-22',
		damage: function () { return Dice.xdx(1,8)() + Dice.xdx(1,8)() + Dice.xdx(2,6)(); },
		exp: 120,
		speed: 60,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Wraith', {
		name: 'レイス',
		character: 'R',
		foreground: 'Black',
		hd: 5,
		ac: 14,
		floor: '14-23',
		damage: Dice.xdx(1,6),
		exp: 55,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('VioletFungi', {
		name: 'バイオレットファンジャイ',
		character: 'F',
		foreground: 'Violet',
		hd: 8,
		ac: 15,
		floor: '15-24',
		damage: function () { return 0; },
		exp: 80,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('InvisibleStalker', {
		name: 'インビジブルストーカー',
		character: '',
		hd: 8,
		ac: 15,
		floor: '16-25',
		damage: Dice.xdx(4,4),
		exp: 120,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Xorn', {
		name: 'ゾーン',
		character: 'X',
		foreground: 'Tan',
		hd: 7,
		ac: 20,
		floor: '17-26',
		damage: function () { return Dice.xdx(1,3)() + Dice.xdx(1,3)() + Dice.xdx(1,3)() + Dice.xdx(4,6)(); },
		exp: 190,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('UmberHulk', {
		name: 'アンバーハルク',
		character: 'U',
		foreground: 'olive',
		hd: 8,
		ac: 16,
		floor: '18-26',
		damage: function () { return Dice.xdx(3,4)() + Dice.xdx(3,4)() + Dice.xdx(2,5)(); },
		exp: 200,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Mimic', {
		name: 'ミミック',
		character: 'M',
		foreground: 'SaddleBrown',
		hd: 7,
		ac: 11,
		floor: '19-26',
		damage: Dice.xdx(3,4),
		exp: 100,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Vampire', {
		name: 'バンパイア',
		character: 'V',
		foreground: 'DarksLateGray',
		hd: 8,
		ac: 17,
		floor: '20-26',
		damage: Dice.xdx(1,10),
		exp: 350,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('PurpleWorm', {
		name: 'パープルワーム',
		character: 'P',
		foreground: 'BlueViolet',
		hd: 15,
		ac: 12,
		floor: '21-26',
		damage: function () { return Dice.xdx(2,12)() + Dice.xdx(2,4)(); },
		exp: 4000,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
	});

  that.Repository.define('Dragon', {
		name: 'ドラゴン',
		character: 'D',
		foreground: 'red',
		hd: 10,
		ac: 17,
		floor: '26-26',
		damage: function () { return Dice.xdx(1,8)() + Dice.xdx(1,8)() + Dice.xdx(3,10)(); },
		exp: 6800,
		tasks: ['hunt', 'wander'],
		mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
			       Mixins.Sight, Mixins.CorpseDropper]
  }, {
		disableRandomCreation: true
	});


  //that.Repository.define('Fungus', {
	//	name: '苔の怪物',
	//	character: 'F',
	//	foreground: '#0F0',
	//	hd: 1,
	//	defenseValue: 6,
	//	speed: 25,
	//	mixins: [Mixins.FungusActor, Mixins.Destructible,
	//	         Mixins.CorpseDropper]
	//});

	//that.Repository.define('Pixie', {
	//	name: 'ピクシー',
	//	character: 'p',
	//	foreground: 'mediumorchid',
	//	hd: 1,
	//	damage: Dice.xdx(1,2),
	//	ac: 15,
	//	speed: 300,
	//	mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible]
	//});

	//that.Repository.define('SewerRat', {
	//	name: 'ドブネズミ',
	//	character: 'r',
	//	foreground: 'olive',
	//	hd: 1,
	//	damage: Dice.xdx(1,6),
	//	ac: 9,
	//	mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible
	//	         ,Mixins.CorpseDropper]
	//});

  //that.Repository.define('kobold', {
	//	name: 'コボルド',
	//	character: 'k',
	//	foreground: 'dodgerblue',
	//	hd: 1,
	//	damage: Dice.xdx(1,4),
	//	ac: 11,
	//	//sightRadius: 16,
	//	tasks: ['hunt', 'wander'],
	//	mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
	//		       Mixins.Sight, Mixins.CorpseDropper]

	//});

  //that.Repository.define('Snake', {
	//	name: '巨大コウモリ',
	//	character: 'B',
	//	foreground: 'red',
	//	hd: 1,
	//	damage: Dice.xdx(1,4),
	//	ac: 12,
	//	speed: 200,
	//	mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
	//		       Mixins.CorpseDropper]
	//});

  //that.Repository.define('Goblin', {
	//	name: 'ゴブリン',
	//	character: 'o',
	//	foreground: 'lightgrey',
	//	hd: 1,
	//	damage: Dice.xdx(1,6),
	//	ac: 12,
	//	//sightRadius: 15,
	//	tasks: ['hunt', 'wander'],
	//	mixins: [Mixins.TaskActor,Mixins.Attacker, Mixins.Destructible,
	//		       Mixins.Sight, Mixins.CorpseDropper]
	//});

	return that;
};

module.exports = {
	Monsters: Monsters 
}

},{"./dice":3,"./entity":5,"./entitymixins":6,"./repository":18}],18:[function(require,module,exports){
var Repository = function(_name, _ctor, _filter) {
	var that = {};

	var name = _name;
	var templates = {};
	var ctor = _ctor;
	var randomTemplates = {};
	var filter = _filter || function () { return true; };

	that.define = function(_name, _template, option) {
		_template.idName = _name;
		templates[_name] = _template;
		var disableRandomCreation = option && option.disableRandomCreation;
		if (!disableRandomCreation && filter(_template)) {
			randomTemplates[_name] = _template;
		}
	}

	that.create = function(_name, extraProperties) {
		if (!templates[_name]) {
			throw new Error("No template named '" + _name + "' in repository '" + name + "'");
		}
		//var template = templates[_name];
		var template = Object.create(templates[_name]);
		if (extraProperties) {
			for (var key in extraProperties) {
				template[key] = extraProperties[key];
			}
		}
		return ctor(template);
	}

	that.createRandom = function() {
	  return that.create(Object.keys(randomTemplates).random());
	}

	return that;
}

module.exports = {
	Repository: Repository
}
		

},{}],19:[function(require,module,exports){
"use strict";

var Screen = function (game) { 
	var that = {};
	var Map = require('./map').Map;
	var Entity = require('./entity').Entity;
	var Character = require('./character').Character;
	var Builder = require('./builder').Builder;
	var Message = require('./message').Message();
	var loadFlg = false;

  // Define our initial start screen
  that.startScreen = (function (){
		var that = {};
    that.enter = function() {
		  var displayDom = game.getDisplayDom("menu");
      displayDom.style.display = "";
		}; 
    that.exit = function() {
      var displayDom = game.getDisplayDom("menu");
      displayDom.style.display = "none";
		};
    that.render = function(display) {
      //game.getDisplay("menu").drawText(1,1, "%c{yellow}\t __________        __                              ");   
      //game.getDisplay("menu").drawText(1,2, "%c{yellow}\t \\______   \\ _____/  |_  ____ _____ ___  __ ____   "); 
      //game.getDisplay("menu").drawText(1,3, "%c{yellow}\t  |       _//  _ \\   __\\/ ___\\\\__  \\\\  \\/ // __ \\  "); 
      //game.getDisplay("menu").drawText(1,4, "%c{yellow}\t  |    |   (  <_> )  | \\  \\___ / __ \\\\   /\\  ___/  "); 
      //game.getDisplay("menu").drawText(1,5, "%c{yellow}\t  |____|_  /\\____/|__|  \\___  >____  /\\_/  \\___  > ");
      //game.getDisplay("menu").drawText(1,6, "%c{yellow}\t         \\/                 \\/     \\/          \\/  "); 
      //game.getDisplay("menu").drawText(1,8, "          \t\t\t\t\t\t\t\tPress [Enter] to start!");
			
      game.getDisplay("menu").drawText(1,1, "ようこそ-[Enter]-");
      //game.getDisplay("menu").drawText(1,2, "Press [Enter] to start!");

    };
    that.handleInput = function(inputType, inputData) {
      if (inputType === 'keydown') {
        if (inputData.keyCode === ROT.VK_RETURN) {
          game.switchScreen(game.Screen.playScreen);
        }
      }
    };
		return that;
  })();

  that.topScreen = (function (screens) {
		var that = {};
		var selectedRow = 0;
		var menuList = [
			'はじめから',
			'つづきから'
		];
    that.render = function (display) {
			display.drawText(0, 0, 'ようこそ');
			var row = 0;
			for (var i = 0; i < menuList.length; i++) {
			  var letter = letters.substring(i, i + 1);
				var str = "";
				if (i === selectedRow) {
				 	str = "%c{black}%b{white}";
				}
				game.getDisplay('menu').drawText(0, 2 + row, str + letter + '%c{}%b{}' +  ' ' + menuList[i] + '\t\t');
				row++;
			}
		}

    that.handleInput = function (inputType, inputData) {
			if (inputType === 'keydown') {
				//Escapeかアイテムを選択していない状態でEnterを押したときはキャンセル
				if (inputData.keyCode === ROT.VK_ESCAPE || inputData.keyCode === ROT.VK_BACK_SPACE) {  
					screens.playScreen.setSubScreen(undefined);
				} else if (inputData.keyCode === ROT.VK_RETURN) {
					//_that.executeOkFunction();
          screens.playScreen.showItemsSubScreen(menuList[selectedRow], null, "");
				} else if (inputData.keyCode === ROT.VK_UP) {
					if (selectedRow > 0) selectedRow--;
					game.refresh();
				} else if (inputData.keyCode === ROT.VK_DOWN) {
					if (selectedRow < menuList.length-1) selectedRow++;
					game.refresh();
				}
			}
		}
		return that;
	})(that);


  that.messageScreen = (function (){
		var that = {};
    that.render = function(row) {
			//日本語文字表示調整
			var _len = row.length;
		  var str = '';
			for (var j=0; j<_len; j++) {
				str += '\t\t';
			}
			game.getDisplay("message").drawText(1, 1, str);
      game.getDisplay("message").drawText(1, 1, '%c{white}%b{black}' + row);
    };
   	return that;
  })();

  // Define our playing screen
  that.playScreen = (function (){
		var that = {};
		var map = null;
		var player = null;
		that.gameEnded = false;
		var subScreen = null;

		//描画関数
		var draw = function (display, fun) {
		  var filter = fun || function () { return true; };
      var screenWidth = game.getScreenWidth();
			var screenHeight = game.getScreenHeight();

			var topLeftX = Math.max(0, player.getX() - (screenWidth / 2));
			topLeftX = Math.min(topLeftX, map.getWidth() - screenWidth);
			var topLeftY = Math.max(0, player.getY() - (screenHeight / 2));
			topLeftY = Math.min(topLeftY, map.getHeight() - screenHeight);

			var visibleCells = {};
			//var memorizedCells = {}; //プレイヤーが記憶したセル情報
			//var map = map;
			var currentDepth = player.getZ();

			if (subScreen) {
				subScreen.render(display);
				return;
			}

			map.getFov(player.getZ()).compute(
					player.getX(), player.getY(), 
					player.getSightRadius(),
					function(x, y, radius, visibility) {
						visibleCells[x + "," + y] = true;
					  //map.setExplored(x, y, currentDepth, true);
						//memorizedCells[x + "," + y + "," + currentDepth] = map.getTile(x, y, currentDepth);
						for (var i = 0; i < 3; i++) {
						  var diff = ROT.DIRS[8][i*2];
							var dx = x + diff[0];
							var dy = y + diff[1];
							var tile = map.getTile(dx, dy, currentDepth);
							if (tile.getName() === 'wallTile') {
						    visibleCells[dx + "," + dy] = true;
							  //map.setExplored(dx, dy, currentDepth, true);
						    //memorizedCells[dx + "," + dy + "," + currentDepth] = map.getTile(dx, dy, currentDepth);
							}
					  }	
					});

			////描画のスピードアップのため画面のクリアは階層移動時のみ行う
			//var playerTile = map.getTile(player.getX(), player.getY(), player.getZ()); 
			//if (['stairsUpTile','stairsDownTile'].indexOf(playerTile.getName()) >= 0) {
			//  game.getDisplay().clear();	
			//}
			//game.getDisplay().clear();	
      
			var z = player.getZ();
			var playerX = player.getX();
			var playerY = player.getY();
			var playerSightRadius = player.getSightRadius();
			for (var x = topLeftX; x < topLeftX + screenWidth; x++) {
				for (var y = topLeftY; y < topLeftY + screenHeight; y++) {
					if (filter(x, y, z)) {
					  var glyph = map.getTile(x, y, z);
					  //if (map.isExplored(x, y, z)) {
					    //壁のグラフィック変更
					    var chr = glyph.getChar();
					    //if (map.getTile(x, y, player.getZ()) === game.wallTile) {
					    //if (map.getTile(x, y, z).getName() === 'wallTile') {
					  	//  chr = map.getPartitionChr(x, y, z);
					    //}
					  	var foreground = glyph.getForeground();
              var background = glyph.getBackground();

					  	//if (visibleCells[x + ',' + y]) {
					  	if (visibleCells[x + ',' + y] || map.getMemorizedCell(x,y,z)) {
                var trap = map.getEquipmentAt(x, y, z); 
					  	  if (trap) {
					  	  	glyph = trap;
					  	  	chr = glyph.getChar();
					  	  }
					  	  var items = map.getItemsAt(x, y, z);
								if (items) {
					  	  	glyph = items[items.length -1];
					  	  	chr = glyph.getChar();
					  	  }
					  	  var entity = map.getEntityAt(x, y, z); 
					  	  if (entity) {
					  	  	glyph = entity;
					  	  	chr = glyph.getChar();
					  	  }
					  		foreground = glyph.getForeground();
					  	} else {
					  		//foreground = 'darkGray';
                var arrColorF = ROT.Color.fromString(foreground);
                    arrColorF = ROT.Color.multiply([100,100,100], arrColorF);
                foreground = ROT.Color.toRGB(arrColorF); 
                //var arrColorB = ROT.Color.fromString(background);
                //    arrColorB = ROT.Color.multiply([100,100,100], arrColorB);
                //background = ROT.Color.toRGB(arrColorB); 
					  		//glyph = map.getMemorizedCell(x, y, z);
					  		//chr = glyph.getChar();
					      //if (map.getTile(x, y, z).getName() === 'wallTile') {
					  	  //  chr = map.getPartitionChr(x, y, z);
					  		//}
					  		//foreground = glyph.getForeground();
					  	}
					  		
					    display.draw(//x, y,
					  	  x - topLeftX,
					  	  y - topLeftY,
					      chr, //glyph.getChar(),
					  	  foreground, //glyph.getForeground(),
					  	  background 
					    );
					  }
			    //}
				}
			}
		}

		var drawTile = function (x, y, z) {
      var glyph = map.getTile(x, y, z);
		  if (map.isExplored(x, y, z)) {
		    //壁のグラフィック変更
		    var chr = glyph.getChar();
		    //if (map.getTile(x, y, player.getZ()) === game.wallTile) {
		    if (map.getTile(x, y, z).getName() === 'wallTile') {
		  	  //chr = map.getWallChr(x, y, z);
		  	  chr = map.getPartitionChr(x, y, z);
		    }
		  	var foreground = glyph.getForeground();

		  	//if (visibleCells[x + ',' + y]) {
		  	if /*(visibleCells[x + ',' + y] ||*/( map.getMemorizedCell(x,y,z)) {
          var trap = map.getEquipmentAt(x, y, z); 
		  	  if (trap) {
		  	  	glyph = trap;
		  	  	chr = glyph.getChar();
		  	  }
		  	  var items = map.getItemsAt(x, y, z);
					if (items) {
		  	  	glyph = items[items.length -1];
		  	  	chr = glyph.getChar();
		  	  }
		  	  var entity = map.getEntityAt(x, y, z); 
		  	  if (entity) {
		  	  	glyph = entity;
		  	  	chr = glyph.getChar();
		  	  }
		  		foreground = glyph.getForeground();
		  	} else {
		  		//foreground = 'darkGray';
		  		//glyph = map.getMemorizedCell(x, y, z);
		  		//chr = glyph.getChar();
		      //if (map.getTile(x, y, z).getName() === 'wallTile') {
		  	  //  chr = map.getPartitionChr(x, y, z);
		  		//}
		  		//foreground = glyph.getForeground();
		  	}
		  		
		    game.getDisplay().draw( //MainDisplay
		  	  x,
		  	  y,
		      chr, //glyph.getChar(),
		  	  foreground, //glyph.getForeground(),
		  	  glyph.getBackground()
		    );
		  }
		}

    that.enter = function() { 
			var displayDom = game.getDisplayDom("main");
			displayDom.style.display = "";
			var width  = 100; //game.getScreenWidth(); //100; 
			var height = 48; //game.getScreenHeight(); //48;
			var depth = 6; //22;//10;

			//TODO: タイルとプレイヤー(あとエンティティ)の情報はサーバーから受け取ることにする
			//var tiles = Builder(game, width, height, depth).getTiles();
			var tiles = Builder(width, height, depth).getTiles();
			
			//player = Entity(game.PlayerTemplate);
			player = Character(game.PlayerTemplate);

			map = Map(tiles, player);

			draw(game.getDisplay());

      //var z = player.getZ();
			//for (var x = 0; x < width; x++) {
			//	for (var y = 0; y < height; y++) {
			//		drawTile(x, y, z);
			//	}
			//}
      
			window.addEventListener('beforeunload', function(e) {
				if (player.isAlive()) {
				  map.saveData();
					player.saveData();
				} else {
					map.clearData();
					player.clearData();
				}
      }, false);

			map.getEngine().start();
			//リアルタイムで動かす。１ラウンド１秒
			/* リアルタイム処理
			setInterval(function () {
				//TODO: サーバーからmap配列を受け取る処理を書く
				//map.getEngine().lock();
				map.getEngine().unlock();
				game.refresh();
				//TODO: サーバーへmap配列を送る処理を書く
				//mapオブジェクトの中に受信と送信のメソッドを書く
				//pipe.sendMap(map);
			}, 1000);
			*/
		};

		that.exit = function() { console.log("Exited play screen."); };

    that.render = function(display) {
      var playerTile = map.getTile(player.getX(), player.getY(), player.getZ()); 
      var playerX = player.getX();
			var playerY = player.getY();
			var playerSightRadius = player.getSightRadius();
      draw(display);
			//draw(display, function (x, y, z) {
      //  return ((['stairsUpTile','stairsDownTile'].indexOf(playerTile.getName()) >= 0) 
			//		  ||
			//		   ((x >= playerX-playerSightRadius-1 && x <= playerX+playerSightRadius+1) &&
			//		    (y >= playerY-playerSightRadius-1 && y <= playerY+playerSightRadius+1)));
			//});

			//var screenWidth = game.getScreenWidth();
			//var screenHeight = game.getScreenHeight();

			//var topLeftX = Math.max(0, player.getX() - (screenWidth / 2));
			//topLeftX = Math.min(topLeftX, map.getWidth() - screenWidth);
			//var topLeftY = Math.max(0, player.getY() - (screenHeight / 2));
			//topLeftY = Math.min(topLeftY, map.getHeight() - screenHeight);

			//var visibleCells = {};
			////var memorizedCells = {}; //プレイヤーが記憶したセル情報
			////var map = map;
			//var currentDepth = player.getZ();

			//if (subScreen) {
			//	subScreen.render(display);
			//	return;
			//}

			//map.getFov(player.getZ()).compute(
			//		player.getX(), player.getY(), 
			//		player.getSightRadius(),
			//		function(x, y, radius, visibility) {
			//			visibleCells[x + "," + y] = true;
			//		  map.setExplored(x, y, currentDepth, true);
			//			//memorizedCells[x + "," + y + "," + currentDepth] = map.getTile(x, y, currentDepth);
			//			for (var i = 0; i < 3; i++) {
			//			  var diff = ROT.DIRS[8][i*2];
			//				var dx = x + diff[0];
			//				var dy = y + diff[1];
			//				var tile = map.getTile(dx, dy, currentDepth);
			//				if (tile.getName() === 'wallTile') {
			//			    visibleCells[dx + "," + dy] = true;
			//				  map.setExplored(dx, dy, currentDepth, true);
			//			    //memorizedCells[dx + "," + dy + "," + currentDepth] = map.getTile(dx, dy, currentDepth);
			//				}
			//		  }	
			//		});

			////描画のスピードアップのため画面のクリアは階層移動時のみ行う
			//var playerTile = map.getTile(player.getX(), player.getY(), player.getZ()); 
			//if (['stairsUpTile','stairsDownTile'].indexOf(playerTile.getName()) >= 0) {
			//  game.getDisplay().clear();	
			//}

			//var z = player.getZ();
			//var playerX = player.getX();
			//var playerY = player.getY();
			//var playerSightRadius = player.getSightRadius();
			//for (var x = topLeftX; x < topLeftX + screenWidth; x++) {
			//	for (var y = topLeftY; y < topLeftY + screenHeight; y++) {
			//    if ((['stairsUpTile','stairsDownTile'].indexOf(playerTile.getName()) >= 0) 
			//		  ||
			//		   ((x >= playerX-playerSightRadius-1 && x <= playerX+playerSightRadius+1) &&
			//		    (y >= playerY-playerSightRadius-1 && y <= playerY+playerSightRadius+1))) {
			//		  var glyph = map.getTile(x, y, z);
			//		  if (map.isExplored(x, y, z)) {
			//		    //壁のグラフィック変更
			//		    var chr = glyph.getChar();
			//		    //if (map.getTile(x, y, player.getZ()) === game.wallTile) {
			//		    if (map.getTile(x, y, z).getName() === 'wallTile') {
			//		  	  //chr = map.getWallChr(x, y, z);
			//		  	  chr = map.getPartitionChr(x, y, z);
			//		    }
			//		  	var foreground = glyph.getForeground();

			//		  	//if (visibleCells[x + ',' + y]) {
			//		  	if (visibleCells[x + ',' + y] || map.getMemorizedCell(x,y,z)) {
      //          var trap = map.getEquipmentAt(x, y, z); 
			//		  	  if (trap) {
			//		  	  	glyph = trap;
			//		  	  	chr = glyph.getChar();
			//		  	  }
			//		  	  var items = map.getItemsAt(x, y, z);
			//					if (items) {
			//		  	  	glyph = items[items.length -1];
			//		  	  	chr = glyph.getChar();
			//		  	  }
			//		  	  var entity = map.getEntityAt(x, y, z); 
			//		  	  if (entity) {
			//		  	  	glyph = entity;
			//		  	  	chr = glyph.getChar();
			//		  	  }
			//		  		foreground = glyph.getForeground();
			//		  	} else {
			//		  		//foreground = 'darkGray';
			//		  		//glyph = map.getMemorizedCell(x, y, z);
			//		  		//chr = glyph.getChar();
			//		      //if (map.getTile(x, y, z).getName() === 'wallTile') {
			//		  	  //  chr = map.getPartitionChr(x, y, z);
			//		  		//}
			//		  		//foreground = glyph.getForeground();
			//		  	}
			//		  		
			//		    display.draw(//x, y,
			//		  	  x - topLeftX,
			//		  	  y - topLeftY,
			//		      chr, //glyph.getChar(),
			//		  	  foreground, //glyph.getForeground(),
			//		  	  glyph.getBackground()
			//		    );
			//		  }
			//    }
			//	}
			//}

			var stats = '%c{white}%b{#1C1C1C}';
			stats += vsprintf('地下:%d階\t', [player.getZ()+1]);
			stats += '  ';
			stats += vsprintf('HP:%d/%d\t', [player.getHp(), player.getMaxHp()]);
			stats += '  ';
			stats += vsprintf('AC:%d\t', [player.getAC()]);
			stats += '  ';
			stats += vsprintf('Str:%d\t', [player.getStr()]);
			stats += '  ';
			stats += vsprintf('Con:%d\t', [player.getCon()]);
			stats += '  ';
			stats += vsprintf('Dex:%d\t', [player.getDex()]);
			//stats += vsprintf('LUC:%d\t', [player.getLuc()]);
			//stats += vsprintf('WIZ:%d\t', [player.getWiz()]);
			stats += vsprintf('%s\t', [player.getHungerState()]);
			game.getDisplay('sub').drawText(1, 0, stats);
			//display.drawText(0, screenHeight+1, stats);

			//var hungerState = player.getHungerState()+'\t';
			//display.drawText(screenWidth - hungerState.length*2, screenHeight, hungerState);
			//display.drawText(screenWidth - hungerState.length*2, screenHeight+1, hungerState);
      game.Screen.messageScreen.render(player.getMessage());
      player.messages(_.rest(player.messages()));

			//var messages = player.getMessages();
			//var messageY = 0;
			//var len = messages.length;
			//for (var i=0; i<len; i++) {
			//	//日本語文字表示調整
			//	var _len = messages[i].length;
			//	var str = '';
			//	for (var j=0; j<_len; j++) {
			//		//str = str + '\t\t';
			//		str += '\t\t';
			//	}
			//	display.drawText(0, messageY, str);
			//	  	
			//	messageY += display.drawText(
			//			0,
			//			messageY,
			//			'%c{white}%b{black}' + messages[i]
			//	);
			//}
    };
	  var move = function (dx, dy, dz) {
			var newX = player.getX() + dx;
			var newY = player.getY() + dy;
			var newZ = player.getZ() + dz;
			player.tryMove(newX, newY, newZ);
		};
		var fire = function (dx, dy, dz) {
			console.log('Fire!');
			var newX = player.getX() + dx;
			var newY = player.getY() + dy;
			var newZ = player.getZ() + dz;ar 
			player.tryFire(newX, newY, newZ);
		};
    that.handleInput = function(inputType, inputData) {
			//メッセージ出力
			if (!_.isEmpty(player.messages())) {
				if (inputType === 'keydown') {
				  game.refresh();
				  return;
				}
			}

			if (that.gameEnded) {
				if (inputType === 'keydown' && inputData.keyCode === ROT.VK_RETURN) {
          game.switchScreen(game.Screen.loseScreen);
				}
		    return;
			}	
			if (subScreen) {
				subScreen.handleInput(inputType, inputData);
				return;
			}
		  	
      if (inputType === 'keydown') {
        if (inputData.keyCode === ROT.VK_RETURN) { //Enterでアイテム拾いとメニュー画面表示
          var items = map.getItemsAt(player.getX(), player.getY(), player.getZ());
					if (!items) { //落ちているアイテムがない場合はメニューを表示させる
						if (game.Screen.inventoryScreen.setup(player, map, player.getItems())) {
					  	that.setSubScreen(game.Screen.inventoryScreen);
					  } else {
					  	game.refresh();
					  }
					} else if (items.length === 1) {
						var item = items[0];
						var describe = item.describeTotal();
						if (player.pickupItems(map, [0])) {
							Message.sendMessage(player, "%sを拾った", [describe]);
						} else {
							Message.sendMessage(player, "背負い袋はいっぱいだ。これ以上持つことはできない");
						}
					} else {
						game.Screen.pickupScreen.setup(player, map, items);
						that.setSubScreen(game.Screen.pickupScreen);
						return;
					}
        } else if (inputData.keyCode === ROT.VK_ESCAPE) {
          //game.switchScreen(game.Screen.loseScreen);
        } else if (inputData.keyCode === ROT.VK_LEFT || inputData.keyCode === ROT.VK_H) {
          if (inputData.shiftKey) {
						fire(-1, 0, 0);
					} else {
				    move(-1, 0, 0);
					}
				} else if (inputData.keyCode === ROT.VK_RIGHT || inputData.keyCode === ROT.VK_L) {
          if (inputData.shiftKey) {
						fire(1, 0, 0);
					} else {
					  move(1, 0, 0);
					}
				} else if (inputData.keyCode === ROT.VK_UP || inputData.keyCode === ROT.VK_K) {
          if (inputData.shiftKey) {
						fire(0, -1, 0);
					} else {
					  move(0, -1, 0);
					}
				} else if (inputData.keyCode === ROT.VK_DOWN || inputData.keyCode === ROT.VK_J) {
          if (inputData.shiftKey) {
						fire(0, 1, 0);
					} else {
					  move(0, 1, 0);
					}
				} else if (inputData.keyCode === ROT.VK_BACK_SPACE) {
				  that.setSubScreen(game.Screen.menuScreen);
				} else if (inputData.keyCode === ROT.VK_I) {
					that.showItemsSubScreen(game.Screen.inventoryScreen, player.getItems(), 
							"何も持っていない");
					return;
				} else if (inputData.keyCode === ROT.VK_D) {
          that.showItemsSubScreen(game.Screen.dropScreen, player.getItems(), 
							"何も持っていない");
					return;
				} else if (inputData.keyCode === ROT.VK_E) {
					that.showItemsSubScreen(game.Screen.eatScreen, player.getItems(), 
							"食べられるものを持っていない");
					return;
				} else if (inputData.keyCode === ROT.VK_W) {
					if (inputData.shiftKey) {
            that.showItemsSubScreen(game.Screen.wearScreen, player.getItems(), 
							"装備できる防具を持っていない");
					} else {
            that.showItemsSubScreen(game.Screen.wieldScreen, player.getItems(), 
							"装備できる武器を持っていない");
					}
					return;
				} else if (inputData.keyCode === ROT.VK_COMMA) {
					var items = map.getItemsAt(player.getX(), player.getY(), player.getZ());
					if (!items) {
						//TODO: 何もないことを示すメッセージを出す
					} else if (items.length === 1) {
						var item = items[0];
						var describe = item.describeTotal();
						if (player.pickupItems(map, [0])) {
							Message.sendMessage(player, "%sを拾った", [describe]);
						} else {
							Message.sendMessage(player, "背負い袋はいっぱいだ。これ以上持つことはできない");
						}
					} else {
            that.showItemsSubScreen(game.Screen.pickupScreen, items, "");
					}
        } else if (inputData.keyCode === ROT.VK_Z) { //デバッグ(階層移動)
		  		player.setPosition(player.getX(), player.getY(), player.getZ()+1);
					return;
				} else {
					return;
				}
				/*リアルタイム処理
				game.refresh();
				*/
				map.getEngine().unlock();
      } else if (inputType === 'keypress') {
				var keyChar = String.fromCharCode(inputData.charCode);
				if (keyChar === '>') {
					move(0, 0, 1);
				} else if (keyChar === '<') {
					move(0, 0, -1);
				} else {
					return;
				}
				/*リアルタイム処理
				game.refresh();
				*/
				map.getEngine().unlock();
			}
    };
		that.showItemsSubScreen = function (subScreen, items, emptyMessage) {
			var items = player.getItems();
			if (items && subScreen.setup(player, map, items) > 0) {
				that.setSubScreen(subScreen);
			} else {
				Message.sendMessage(this.player, emptyMessage);
				game.refresh();
			}
		};
		that.setGameEnded = function(_gameEnded) {
			that.gameEnded = _gameEnded;
		};
		that.setSubScreen = function (_subScreen) {
      var mainDom = game.getDisplayDom("main");
      var menuDom = game.getDisplayDom("menu");
			if (_subScreen) {
        menuDom.style.display = "";
        mainDom.style.display = "none";
			} else {
        menuDom.style.display = "none";
        mainDom.style.display = "";
			}
			subScreen = _subScreen;
			game.refresh();
		};
		return that;
	})();

	
	var ItemListScreen = function (template) {
		var _that = {};

		var caption = template.caption;
		var help = template.help;
		_that.okFunction = template.ok;

		//アイテムリストを開けるかどうかを返す関数(デフォルトはアイテムを持っているか)
		_that.isAcceptableFunction = template.isAcceptable || function (x) {return x; }
		var canSelectItem = template.canSelect;
		var canSelectMultipleItems = template.canSelectMultipleItems;

		_that.player = null;
		_that.map = null;
		_that.items = null;
		_that.selectedIndices = {};
		_that.selectedRow = 0;

		_that.getCaption = function () {
			return caption;
		}

		_that.setup = function (player, map, items) {
			_that.player = player;
			_that.map = map;
			//_that.items = items;
			var count = 0;
			//var items = hands.concat(items);
			//_that.items = _.filter(items, function (item) {
			_that.items = _.map(items, function (item) {
				if (_that.isAcceptableFunction(item)) {
					count++;
					return item;
				} else {
					return null;
				}
			});

			//_that.items = items.map(function(item) {
			//	if (_that.isAcceptableFunction(item)) {
			//		count++;
			//		return item;
			//	} else {
			//		//return null;
			//	}
			//});
			_that.selectedIndices = {};
			return count;
		}

		_that.render = function (display) {
			var letters = 'abcdefghijklmnopqrstuvwxyz';

			//display.drawText(0, 0, caption);
			var row = 0;
			for (var i = 0; i < _that.items.length; i++) {
				if (_that.items[i]) {
					var letter = letters.substring(i, i + 1);
					var selectionState = (canSelectItem && canSelectMultipleItems && _that.selectedIndices[i]) ? '+' : '-';
					var str = "";
					if (i === _that.selectedRow) {
					 	str = "%c{black}%b{white}";
					}
					var item = _that.items[i];
					//display.drawText(0, 2 + row, str + letter + '%c{}%b{}' + ' ' + selectionState + ' ' + item.describeTotal() + '\t\t');
					game.getDisplay('menu').drawText(0, 1 + row, str + letter + '%c{}%b{}' + ' ' + selectionState + ' ' + item.describeTotal() + '\t\t');
					row++;
				}
			}
		}

		_that.executeOkFunction = function () {
			var selectedItems = {};
			for (var key in _that.selectedIndices) {
		    selectedItems[key] = _that.items[key];
			}
						game.Screen.playScreen.setSubScreen(undefined);
			if (_that.okFunction(selectedItems)) {
				_that.player.getMap().getEngine().unlock();
			}
		}
		

		_that.handleInput = function (inputType, inputData) {
			if (inputType === 'keydown') {
				//Escapeかアイテムを選択していない状態でEnterを押したときはキャンセル
				if (inputData.keyCode === ROT.VK_ESCAPE || inputData.keyCode === ROT.VK_BACK_SPACE) { 
						//(inputData.keyCode === ROT.VK_RETURN && (!canSelectItem || Object.keys(_that.selectedIndices).length === 0))) {
					game.Screen.playScreen.setSubScreen(undefined);
				} else if (canSelectItem && inputData.keyCode === ROT.VK_RETURN) {
          var index = _that.selectedRow;
					if (!canSelectMultipleItems) {
            _that.selectedIndices[index] = true;
					}
					_that.executeOkFunction();
				} else if (inputData.keyCode === ROT.VK_UP) {
					if (_that.selectedRow > 0) _that.selectedRow--;
					game.refresh();
				} else if (inputData.keyCode === ROT.VK_DOWN) {
					if (_that.selectedRow < _that.items.length-1) _that.selectedRow++;
					game.refresh();
				} else if ((canSelectItem && inputData.keyCode === ROT.VK_SPACE) ||
						(canSelectItem && inputData.keyCode >= ROT.VK_A && inputData.keyCode <= ROT.VK_Z)) {
					if (inputData.keyCode === ROT.VK_SPACE) { //スペースのときはカーソルのあるアイテムを選択
            var index = _that.selectedRow;
					} else {
					  var index = inputData.keyCode - ROT.VK_A; //スペース以外はその文字のアイテムを選択
					}
					if (_that.items[index]) {
						if (canSelectMultipleItems) {
							if (_that.selectedIndices[index]) {
								delete _that.selectedIndices[index];
							} else {
								_that.selectedIndices[index] = true;
							}
							game.refresh();
						} else {
							_that.selectedIndices[index] = true;
							_that.executeOkFunction();
						}
					}
				}
			}
		}
		return _that;
	}

	that.inventoryScreen = ItemListScreen({
		caption: '持ち物を確認する',
		help: '持ち物',
	  canSelect: false
	});

	that.pickupScreen = ItemListScreen({
		caption: '拾う',
		help: 'どれを拾いますか？',
		canSelect: true,
		canSelectMultipleItems: true,
		ok: function(selectedItems) {
			if (!this.player.pickupItems(this.map, Object.keys(selectedItems))) {
				//TODO: もう持てないことを示すメッセージを出す
			}
			return true;
		}
	});

	that.dropScreen = ItemListScreen({
		caption: '捨てる',
		help: 'どれを捨てますか？',
		canSelect: true,
		canSelectMultipleItems: false,
		ok: function(selectedItems) {
			this.player.dropItem(this.map, Object.keys(selectedItems)[0]);
			return true;
		}
	});

	that.eatScreen = ItemListScreen({
		caption: '食べる',
		help: 'どれを食べますか？',
		canSelect: true,
		canSelectMultipleItems: false,
		isAcceptable: function(item) {
			return item && item.hasMixin('Edible');
		},
		ok: function(selectedItems) {
			var key = Object.keys(selectedItems)[0];
			var item = selectedItems[key];
			Message.sendMessage(this.player, "%sを食べた", [item.describe()]);
			item.eat(this.player);
			this.player.removeItem(key);
			//if (!item.hasRemainingConsumptions()) {
			//	this.player.removeItem(key);
			//}
			return true;
		}
	});

	that.wieldScreen = ItemListScreen({
		caption: '装備する武器を選んでください',
		help: 'どれを装備しますか？',
	  canSelect: true,
		canSelectMultipleItems: false,
		//hasNoItemOption: true,
		isAcceptable: function (item) {
			return item && item.hasMixin('Equippable') && item.isWieldable();
		},
		ok: function (selectedItems) {
			var keys = Object.keys(selectedItems);
			if (keys.length === 0) {
				Message.sendMessage(this.player, "あなたは手を空けた");
			} else {
				var item = selectedItems[keys[0]];
				var key = keys[0];
				Message.sendMessage(this.player, "%sを装備した", [item.describe()]);
				//this.player.unequip(item);
				this.player.wield(item, key);
			}
			return true;
		}
	});	

  that.wearScreen = ItemListScreen({
		caption: '装備する防具を選んでください',
		help: 'どれを装備しますか？',
	  canSelect: true,
		canSelectMultipleItems: false,
		//hasNoItemOption: true,
		isAcceptable: function (item) {
			return item && item.hasMixin('Equippable') && item.isWearable();
		},
		ok: function (selectedItems) {
			var keys = Object.keys(selectedItems);
			if (keys.length === 0) {
				this.player.takeOff();
				Message.sendMessage(this.player, "何も装備していない");
			} else {
				var item = selectedItems[keys[0]];
				Message.sendMessage(this.player, "%sを装備した", [item.describe()]);
        //this.player.unequip(item);
				this.player.wear(item);
			}
			return true;
		}
	});	

	that.equipScreen = ItemListScreen({
		caption: '装備する',
		help: 'どれを装備しますか？',
    canSelect: true,
		canSelectMultipleItems: false,
		//hasNoItemOption: true,
		isAcceptable: function (item) {
			return item && item.hasMixin('Equippable');
		},
		ok: function (selectedItems) {
			var keys = Object.keys(selectedItems);
			if (keys.length === 0) {
				//this.player.unwield();
			} else {
				var item = selectedItems[keys[0]];
				var key = keys[0];
				if (item.getEquipState()) {
				  Message.sendMessage(this.player, "それはすでに装備している");
				} else {
				  Message.sendMessage(this.player, "%sを装備した", [item.describe()]);
				  this.player.equip(item, key);
				}
			}
			return true;
		}
	});

	//メニュースクリーン
  that.menuScreen = (function (screens) {
		var that = {};
		var selectedRow = 0;
		var menuList = [
			screens.inventoryScreen,
			screens.dropScreen,
			screens.eatScreen,
			screens.equipScreen
		];
    that.render = function (display) {
			var letters = 'abcdefghijklmnopqrstuvwxyz';

			display.drawText(0, 0, 'どうしますか？');
			var row = 0;
			for (var i = 0; i < menuList.length; i++) {
			  var letter = letters.substring(i, i + 1);
				var str = "";
				if (i === selectedRow) {
				 	str = "%c{black}%b{white}";
				}
				var screen = menuList[i];
				game.getDisplay('menu').drawText(0, 2 + row, str + letter + '%c{}%b{}' +  ' ' + screen.getCaption() + '\t\t');
				row++;
			}
		}

    that.handleInput = function (inputType, inputData) {
			if (inputType === 'keydown') {
				//Escapeかアイテムを選択していない状態でEnterを押したときはキャンセル
				if (inputData.keyCode === ROT.VK_ESCAPE || inputData.keyCode === ROT.VK_BACK_SPACE) {  
					screens.playScreen.setSubScreen(undefined);
				} else if (inputData.keyCode === ROT.VK_RETURN) {
					//_that.executeOkFunction();
          screens.playScreen.showItemsSubScreen(menuList[selectedRow], null, "");
				} else if (inputData.keyCode === ROT.VK_UP) {
					if (selectedRow > 0) selectedRow--;
					game.refresh();
				} else if (inputData.keyCode === ROT.VK_DOWN) {
					if (selectedRow < menuList.length-1) selectedRow++;
					game.refresh();
				}
			}
		}
		return that;
	})(that);

  // Define our winning screen
  that.winScreen = (function (){
		var that = {};
    that.enter = function() { console.log("Entered win screen."); };
    that.exit = function() { console.log("Exited win screen."); };
    that.render = function(display) {
      // Render our prompt to the screen
      for (var i = 0; i < 22; i++) {
        // Generate random background colors
        var r = Math.round(Math.random() * 255);
        var g = Math.round(Math.random() * 255);
        var b = Math.round(Math.random() * 255);
        var background = ROT.Color.toRGB([r, g, b]);
          display.drawText(2, i + 1, "%b{" + background + "}You win!");
      }
    };
    that.handleInput = function(inputType, inputData) {
        // Nothing to do here      
    };
		return that;
  })();

  // Define our winning screen
  that.loseScreen = (function (){
		var that = {};
    that.enter = function() { console.log("Entered lose screen."); };
    that.exit = function() { console.log("Exited lose screen."); };
    that.render = function(display) {
      // Render our prompt to the screen
      //display.drawText(2, i + 1, "%b{red}You lose! :(");
      display.drawText(2, 1, "GAME OVER");
    };
    that.handleInput = function(inputType, inputData) {
        // Nothing to do here      
    };
		return that;
  })();

	return that;
};

module.exports = {
	Screen: Screen
};

},{"./builder":1,"./character":2,"./entity":5,"./map":15,"./message":16}],20:[function(require,module,exports){
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

},{"./glyph":11}],21:[function(require,module,exports){
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
		character: '#'
		,foreground: 'goldenrod'
		,walkable: false
		,diggable: true 
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

},{"./tile":20}]},{},[10]);
