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
	  		//that[key] = mixin[key];
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
