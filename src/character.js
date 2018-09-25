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
