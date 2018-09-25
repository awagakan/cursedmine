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


