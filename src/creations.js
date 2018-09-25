var Repository = require('./repository').Repository;
var Entity = require('./entity').Entity;

var Creations = function() {
	var that = {};

	that.MonsterRepository = Repository('monsters', Entity);

	that.MonsterRepository.define('bat', {
		name: '
	
