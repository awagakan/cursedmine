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

