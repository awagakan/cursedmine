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

