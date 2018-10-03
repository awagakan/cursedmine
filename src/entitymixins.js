"use strict";

var Message = require('./message').Message();

var EntityMixins = (function (){
	var that = {};
	var Entity = require('./entity').Entity;
	var Monsters = require('./monsters').Monsters;
	var Items = require('./items').Items();
	var Dice = require('./dice').Dice();
	
  var sendMessage = function (recipient, message, args) {
		if (recipient.hasMixin(that.MessageRecipient)) {
			if (args) {
				message = vsprintf(message, args);
			}
			recipient.receiveMessage(message);
		}
	}

	var sendMessageNearby = function (map, centerX, centerY, centerZ, message, args) {
		if (args) {
			message = vsprintf(message, args);
		}
		var entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
		var len = entities.length;
		for (var i=0; i<len; i++) {
			if (entities[i].hasMixin(that.MessageRecipient)) {
				entities[i].receiveMessage(message);
			}
		}
	}


	that.PlayerActor = function (game) {
		return {
			name: 'PlayerActor',
		  groupName: 'Actor',
			init: function (_that, template) {
				_that.gold = 0;
				return _that;
			},
			getGold: function () {
				return this.gold;
			},
			setGold: function (gold) {
				this.gold = gold;
			},
		  act: function () {
				if (this.acting) {
					return;
				}
				this.acting = true;
				this.addTurnHunger();
				//this.addTurnHeal();
				//this.levelUp();
				if (!this.isAlive()) {
					game.Screen.playScreen.setGameEnded(true);
				}
			  game.refresh();
			  this.getMap().getEngine().lock();
				//this.clearMessages();
				this.acting = false;
				/*リアルタイム処理
			  this.getMap().getEngine().unlock();
				*/
		  }
		};
	}

	that.FungusActor =  {
		name: 'FungusActor',
		groupName: 'Actor',
		init: function (_that, template) {
			//_that.growthsRemaining = template.growthsRemaining || 5;
			_that.growthsRemaining =  5;
		 return _that;
		},	 
		act: function (){
			if (this.growthsRemaining > 0 && this.getMap().getPlayer().getZ() === this.getZ()) {
				if (Math.random() <= 0.02) {
					var xOffset = Math.floor(Math.random() * 3) -1;
					var yOffset = Math.floor(Math.random() * 3) -1;
					
					if (xOffset != 0 || yOffset != 0) {
						if (this.getMap().isEmptyFloor(this.getX() + xOffset, 
									                         this.getY() + yOffset,
																					 this.getZ())) {
							var monsters = Monsters(this.getZ());
							var entity = monsters.Repository.create(this.getIdName()); 
							var x = this.getX() + xOffset;
							var y = this.getY() + yOffset;
							var z = this.getZ();
							//entity.setPosition(this.getX() + xOffset,
							//                   this.getY() + yOffset,
							//									 this.getZ());
							//this.getMap().addEntity(entity);
							this.getMap().addEntity(x, y, z, entity);
							this.growthsRemaining--;

							sendMessageNearby(this.getMap(),
									entity.getX(), entity.getY(), entity.getZ(),
									'%sは分裂した。 ', [entity.getName()]);

							//this.delMixin(that.FungusActor);
						}
					}
				}
			}
		}
	}

	that.Destructible =  {
		name: 'Destructible',
		init: function (_that, template) {
			_that.hd = template.hd || 0;
      _that.maxHp = template.maxHp || Dice.xdx(_that.hd, 8)();
			_that.hp    = template.hp || _that.maxHp; 
			_that.ac = template.ac || 0;
			_that.maxHealCount = template.healCount || null;
			_that.healCount = template.healCount || null; 
			_that.exp = template.exp + Math.round(_that.hp / 6) || 0; //基礎expにhpの６分の１を加える
			return _that;
		},
		//init: function (template) {
		//	this.maxHp = template.maxHp || 10;
		//	this.hp    = template.hp || _that.maxHp; 
		//	this.defenseValue = template.defenseValue || 0;
		//	this.ac = template.ac || 10; //アーマークラス（AC）
		//},
   	getHp: function () {
			return this.hp;
		},
		getMaxHp: function () {
			return this.maxHp;
		},
		setHp: function (hp) {
			this.hp = hp;
		},
		setMaxHp: function (maxHp) {
			this.maxHp = maxHp;
		},
		getExp: function () {
			return this.exp;
		},
		getAC: function () {
			if (this.hasMixin('Equipper')) {
			  var equipments = this.getAllEquipments();
			  return _.reduce(equipments, function (memo, element) {
					return element ? memo += element.getAC() : memo;
			  }, this.ac);
			} else {
			  return this.ac;
			}
		},
		takeDamage: function (attacker, damage) {
		//takeDamage: function (damage) {
			this.hp -= damage;
			if (this.hp <= 0) {
				if (attacker.hasMixin('Attacker')) {
					attacker.destroy(this);
				}
				//sendMessage(attacker, 'あなたは%sを倒した。 ', [this.getName()]);
				if (this.hasMixin('CorpseDropper')) {
					this.tryDropCorpse();
				}
				this.kill();
			}
		},
	  addTurnHeal: function () {
			if (this.healCount && this.hp < this.maxHp) {
		    this.healCount -= 1;
			  if (this.healCount === 0) {
				  this.hp += 1;
				  this.healCount = this.maxHealCount;
				}
			}
		}
	}

	that.Attacker = {
		name: 'Attacker',
		groupName: 'Attacker',
		init: function (_that, template) {
			_that.damage = template.damage || function () {return 0};
			_that.specials = template.specials || []; //special attack e.) poison, paralysis...etc
		  return _that;
		},
		//init: function (template) {
		//	this.attackValue = template.attackValue || 1;
		//	this.damageDice  = template.damageDice  || 6; //d6
		//	this.attackBonus = template.attackBonus || 0;
		//},
		hitRole: function () {
			return Dice.d20();
		},
		giveDamage: function (target) {
			var damage = this.damage;
			if (this.hasMixin('Equipper') && this.getMainHand()) {
				damage = this.getMainHand().getDamage();
			}
			return (this.hitRole() >= target.getAC()) ? damage() : 0;
		},	
		attack: function (target) {
			if (target.hasMixin('Destructible')) {
				var damage = this.giveDamage(target);
				if (damage > 0) {
					sendMessage(this, 'あなたの攻撃は命中した', [target.getName(), damage]);
					sendMessage(target, '%sの攻撃は命中した', [this.getName(), damage]);
				  target.takeDamage(this, damage);
				  //_.each(this.special, function (val, ind, obj) {
					//	val(target);
					//});
				} else {
          sendMessage(this, 'あなたの攻撃は外れた。 ');
					sendMessage(target, '%sの攻撃は外れた。 ', [this.getName()]);
				}
			}
		},
		destroy: function (target) {
			if (this.hasMixin('PlayerActor')) {
				this.addExp(target.getExp());
        sendMessage(this, '%sを倒した。 ', [target.getName()]);
			}
		},
		poison: function (target) {
			if (target.hasMixin('PlayerActor')) {
			}
		}
	}

	that.SimpleAttacker = {
		name: 'SimpleAttacker',
		groupName: 'Attacker',
		attack: function (target) {
			if (target.hasMixin('Destructible')) {
				target.takeDamage(this, 1);
			}
		}
	}
		
	that.MessageRecipient = {
		name: 'MessageRecipient',
    init: function (_that, template) {
			//_that.messages = [];
			return _that;
		},
		//init: function (template) {
		//	this.messages = [];
		//},
    messages: (function () {
			var messages = [];
			return function (_messages) {
				if (_messages) { messages = _messages; }
				return messages;
			}
		})(),
		receiveMessage: function (message) {
			var messages = this.messages();
			messages.push(message);
			this.messages(messages);
			//this.messages.push(message);
		},
		getMessage: function () {
			var messages = this.messages();
			var message = '%c{white}%b{#1C1C1C}';
			if (!_.isEmpty(messages)) {
			  message += _.first(messages);
			  if (!_.isEmpty(_.rest(messages))) {
			  	message += "-[more]-";
			  }
			} else {
				message += "";
			}
			return message;
		},
		//getMessages: function () {
		//	return this.messages();
		//	//return this.messages;
		//},
		clearMessages: function () {
			var messages = [];
			this.messages(messages);
			//this.messages = [];
		},
	}
	
	that.Sight = {
		name: 'Sight',
		groupName: 'Sight',
    init: function(_that, template) {
			_that.sightRadius = template.sightRadius || 20; //1;//5;
			return _that;
		},
		//init: function(template) {
		//	this.sightRadius = template.sightRadius || 10;//5;
		//},
		getSightRadius: function() {
		  return this.sightRadius;
		},
		canSee: function (entity) {
			if (!entity || this.getMap() !== entity.getMap() || this.getZ() !== entity.getZ()) {
				return false;
			}

      var otherX = entity.getX();
      var otherY = entity.getY();

      if ((otherX - this.getX()) * (otherX - this.getX()) +
          (otherY - this.getY()) * (otherY - this.getY()) >
          this.sightRadius * this.sightRadius) {
          return false;
      }

      var found = false;
      this.getMap().getFov(this.getZ()).compute(
          this.getX(), this.getY(), 
          this.getSightRadius(), 
          function(x, y, radius, visibility) {
              if (x === otherX && y === otherY) {
                  found = true;
              }
          });
      return found;
    }

	}

	that.WanderActor = {
		name: 'WanderActor',
		groupName: 'Actor',
		act: function() {
			var moveOffset = (Math.round(Math.random()) === 1) ? 1: -1;
			if (Math.round(Math.random()) === 1) {
				this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
			} else {
				this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
			}
		}
	}

	that.InventoryHolder = {
		name: 'InventoryHolder',
		init: function (_that, template) {
			//var inventorySlots = template.inventorySlots || 10; //10;
			//_that.items = new Array(inventorySlots);
			_that.inventorySlots = template.inventorySlots || 20; //10; //10;
			_that.items = []; 
			_that.itemsTotal = 0;
			return _that;
		},
		getItems: function () {
			return this.items; 
		},
		getItem: function (i) {
			return this.items[i];
		},
		getItemNum: function () {
			return this.itemNum;
		},
		addItem: function (item) {
			//for (var i = 0; i < this.items.length; i++) {
			if (this.canAddItem()) {
			  for (var i = 0; i < this.inventorySlots; i++) {
			  	if (!this.items[i]) {
			  		this.items[i] = item;
			  		//this.itemNum = i;
			      this.itemsTotal = this.itemsTotal + item.getNumber();
			  		return true;
			  	} else { //同名のアイテムは所持数を増やす
			  		//if (this.items[i].describe() === item.describe()) {
			  		if (this.items[i].identity() === item.identity()) {
			  			var num = this.items[i].getNumber() + item.getNumber();
			  			this.items[i].setNumber(num);
			        this.itemsTotal = this.itemsTotal + item.getNumber();
			  			return true;
			  		}
			  	}
			  }
			} else {
			  return false;
			}
		},
		removeItem: function (i) {
			this.itemsTotal--;
			if (this.items[i] && this.hasMixin('Equipper')) {
				//this.unequip(this.items[i]);
			}
			var num = this.items[i].getNumber() -1;
			this.items[i].setNumber(num);
			if (this.items[i].getNumber() <= 0) {
				//this.items[i] = null;
				this.items.splice(i, 1);
			}
		},
		canAddItem: function () {
			return (this.itemsTotal < this.inventorySlots); 
			//for (var i = 0; i< this.items.length; i++) {
			//	if (!this.items[i]) {
			//		return true;
			//	}
			//}
		},
		pickupItems: function (map, indices) {
			var mapItems = map.getItemsAt(this.getX(), this.getY(), this.getZ());
			var added = 0;
			for (var i = 0; i < indices.length; i++) {
				if (this.addItem(mapItems[indices[i] - added])) {
					mapItems.splice(indices[i] - added, 1);
					added++;
				} else {
					break;
				}
			}
			map.setItemsAt(this.getX(), this.getY(), this.getZ(), mapItems);
			return added === indices.length;
		},
		dropItem: function (map, i, num) {
			var num = num || 1;
			if (this.items[i]) {
				if (map) {
					//捨てるときは捨てるアイテムブジェクトをコピーしたものをマップに置く
					var item = this.items[i].copy();
					//捨てる数を設定
					item.setNumber(num);
					//マップに置く
					map.addItem(this.getX(), this.getY(), this.getZ(), item);
				}
				//捨てた数だけアイテムリストから取り除く
				for (var n=0; n<num; n++) {
				  this.removeItem(i);
				}
			}
		},
		changeName: function (i, newName, num) {
			var num = num || 1;
			//アイテムのオブジェクトをコピーして名前を変更する
			var item = this.items[i].copy();
			item.setName(newName);
			for (var n=0; n<num; n++) {
				this.addItem(item);
				this.removeItem(i);
			}
			return item;
		},
		clearItems: function () {
			this.items = [];
		}
	}

	that.FoodConsumer = {
		name: 'FoodConsumer',
		init: function (_that, template) {
			_that.maxFullness = template.maxFullness || 2000;
			_that.fullness    = template.fullness    || 900;//1250;
			_that.fullnessDepletionRate = template.fullnessDepletionRate || 1;
			return _that;
		},
		addTurnHunger: function () {
		  this.modifyFullnessBy(this.fullnessDepletionRate * -1);
		},
		modifyFullnessBy: function (points) {
			if (this.fullness <= 0) {
				this.kill("あなたは餓死した...");
			} else if (this.fullness > this.maxFullness && points > 0) {
				this.kill("あなたは食べ過ぎて倒れた...");
			}
			this.fullness = this.fullness + points;
	  },
		getHungerState: function () {
			var perPercent = this.maxFullness / 100;
			if (this.fullness <= perPercent * 1) {
				return '瀕死';
			} else if (this.fullness <= perPercent * 7.5) {
				return '飢餓';
			} else if (this.fullness <= perPercent * 15) {
				return '空腹';
			} else if (this.fullness >= perPercent * 90) {
				return '満腹';
			} else {
				return '';
			}
		}
	}

	that.CorpseDropper = {
		name: 'CorpseDropper',
		init: function(_that, template) {
			_that.corpseDropRate = template['corpseDropRate'] || 100;
			return _that;
		},
		tryDropCorpse: function() {
			if (Math.round(Math.random() * 100) < this.corpseDropRate) {
				var map = this.getMap();
				map.addItem(this.getX(), this.getY(), this.getZ(),
				  Items.Repository.create('corpse', {
				  	name: this.getName() + 'の死体',
				  	foreground: this.getForeground()
				  }));
			}
		}
	}

	that.Equipper = {
		name: 'Equipper',
		init: function(_that, template) {
			_that.mainHand = null;
			_that.subHand = null;
			_that.armor = null;
			_that.shield = null;
			_that.setMainHand = this.set('mainHand');
			_that.setSubHand  = this.set('subHand');
			_that.setArmor    = this.set('armor');
			_that.setShield   = this.set('shield');
			return _that;
		},
    //wieldHand: function (hand) {
		set: function (part) {
			return function (item) {
			  if (this[part]) {
					this.unset(part);
			  }
			  this[part] = item;
			}
		},
		//unwieldHand: function (hand) {
		unset: function (part) {
			this[part].setEquipState(false);
			this[part] = null;
		},
		equip: function (item) {
			if (item.getType() === 'weapon') {
			  this.wield(item);
			} else {
			  this.wear(item);
			}	
		},
		wield: function (item) {
			if ((item !== this.mainHand) && (item !== this.subHand)) {
				item.setEquipState(true);
			  if (item.twoHand) {
			  	this.setShield(null);
			  }
				this.setMainHand(item);
			}
		},
		wear: function (item) {
			var type = item.getType();
			item.setEquipState(true);
			if (this[type]) {
				this.takeOff(type);
			}
			this[type] = item;
			//this.armor = item;
		},
		takeOff: function (type) {
			this[type].setEquipState(false);
			this[type] = null;
			//this.armor = null;
		},
		getMainHand: function () {
			return this.mainHand;
		},
		getSubHand: function () {
			return this.subHand;
		},
		getArmor: function () {
			return this.armor;
		},
		getAllEquipments: function () {
			return [
				this.mainHand,
				this.subHand,
				this.armor,
				this.shield
			];
		},
		unequip: function (item) {
			if (this.mainHand === item) {
				this.unwieldRight();
			} 
			if (this.subHand === item) {
				this.unwieldLeft();
			} 
			if (this.armor === item) {
				this.takeOff();
			} 
		}
	}

	that.TaskActor = {
    name: 'TaskActor',
    groupName: 'Actor',
    init: function(_that, template) {
      _that.tasks = template['tasks'] || ['wander']; 
			_that.territory = template['territory'] || 20;
			_that.warning = false;
			return _that;
		},
    act: function() {
			var player = this.getMap().getPlayer();
			var z = this.getZ();
			if (z >= player.getZ()-1 && z <= player.getZ()+1) {
        for (var i = 0; i < this.tasks.length; i++) {
          if (this.canDoTask(this.tasks[i])) {
            this[this.tasks[i]]();
            return;
          }
        }
			}
    },
		//テリトリー内にプレイヤーがいるかどうか(上下階は周囲5マスに階段があるとき）
		withinTerritory: function () {
			var x = this.getX();
			var y = this.getY();
			var z = this.getZ();
			var map = this.getMap();
			var player = map.getPlayer();
			return map.isEntityWithinRadius(x, y, z, this.territory, player) 
			    || !_.isEmpty(map.getEquipmentsWithinRadius(x, y, z, 5, 'Stairs')); 
		},
    canDoTask: function(task) {
      if (task === 'hunt') {
        //return this.hasMixin('Sight') && this.canSee(this.getMap().getPlayer());
				return this.withinTerritory();
      } else if (task === 'wander') {
        return true;
      } else {
        throw new Error('Tried to perform undefined task ' + task);
      }
    },
    hunt: function() {
			const depthTerritory = 5;
			var map    = this.getMap();
      var player = map.getPlayer();

      var offsets = Math.abs(player.getX() - this.getX()) + 
                    Math.abs(player.getY() - this.getY());
      if (offsets === 1 && this.getZ() === player.getZ()) {
        if (this.hasMixin('Attacker')) {
          this.attack(player);
          return;
        }
      }

			var target = player; 
			//var stairs = null;
			//if (this.getZ() > player.getZ()) {
			//  var equipments = map.getEquipmentsWithinRadius(this.getX(), this.getY(), this.getZ(), depthTerritory);
			//	stairs = _.find(equipments, function (value, key) {
			//		return value.hasMixin('UpStairs');
			//	});
			//	
			//} else 
			//if (this.getZ() < player.getZ()) {
			//  var equipments = map.getEquipmentsWithinRadius(this.getX(), this.getY(), this.getZ(), depthTerritory);
			//	stairs = _.find(equipments, function (value, key) {
			//		return value.hasMixin('DownStairs');
			//	});
			//}
      //if (stairs) {
			//	target = stairs;
			//}
			//
			//if (target !== player) {
			//	//階段上にいる場合に階層移動
			//	var tile = map.getTile(this.getX(), this.getY(), this.getZ()); 
			//	if (tile.getName() === "stairsDownTile") {
			//		this.tryMove(this.getX(), this.getY(), this.getZ()+1);
			//	} else 
			//	if (tile.getName() === "stairsUpTile") {
			//		this.tryMove(this.getX(), this.getY(), this.getZ()-1);
			//	}
			//	//階段のとなりにいる場合に階段上に移動
			//	var equipments = map.getEquipmentsWithinRadius(this.getX(), this.getY(), this.getZ(), 1);
			//	var stairs = _.find(equipments, function (value, key) {
			//		return value.hasMixin('Stairs');
			//	});
			//	if (stairs) {
			//		this.tryMove(stairs.getX(), stairs.getY(), stairs.getZ());
			//	}
			//}

      var source = this;
      var z = source.getZ();
      //var path = new ROT.Path.AStar(player.getX(), player.getY(), function(x, y) {
      var path = new ROT.Path.AStar(target.getX(), target.getY(), function(x, y) {
        var entity = source.getMap().getEntityAt(x, y, z);
        if (entity && entity !== player && entity !== source) {
          return false;
        }
        return source.getMap().getTile(x, y, z).isWalkable();
      }, {topology: 4});
      var count = 0;
      path.compute(source.getX(), source.getY(), function(x, y) {
        if (count == 1) {
          source.tryMove(x, y, z);
        }
        count++;
      });
    },
    wander: function() {
      var moveOffset = (Math.round(Math.random()) === 1) ? 1 : -1;
      if (Math.round(Math.random()) === 1) {
        this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
      } else {
        this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
      }
    }
  }

	//遠距離攻撃するもの
	that.FireAttacker = {
    name: 'FireAttacker',
		init: function(_that, template) {
			_that.isLoaded   = template['isLoaded']   || false;
			_that.fireDamage = template['fireDamage'] || 0; 
			_that.fireRange  = template['fireRange']  || 0;
			_that.fireNum    = template['fireNum']    || 0;
			return _that;
		},
		loadFire: function (damage, range, num) {
		},
		tryFire: function() {
			if (this.isLoaded) {
			}
		}

	}

	return that;
})();

module.exports = {
	EntityMixins: EntityMixins
}
