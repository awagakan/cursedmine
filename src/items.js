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


