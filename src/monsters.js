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
			       Mixins.Sight, Mixins.CorpseDropper, Mixins.FungusActor]

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
			       Mixins.Sight, Mixins.CorpseDropper, Mixins.FungusActor]
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
