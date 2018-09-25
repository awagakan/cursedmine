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
		var tile = map.getTile(x, y, that.getZ());
		var target = map.getEntityAt(x, y, that.getZ());

		//if (player.getZ() === that.getZ()) { 
		var pZ = player.getZ();
		if (_.contains([pZ-1, pZ, pZ+1], that.getZ())) { //プレイヤーの上下一階までを動かす 
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
