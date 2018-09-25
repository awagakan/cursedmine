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

