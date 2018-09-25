"use strict";

var Screen = function (game) { 
	var that = {};
	var Map = require('./map').Map;
	var Entity = require('./entity').Entity;
	var Character = require('./character').Character;
	var Builder = require('./builder').Builder;
	var Message = require('./message').Message();
	var loadFlg = false;

  // Define our initial start screen
  that.startScreen = (function (){
		var that = {};
    that.enter = function() {
		  var displayDom = game.getDisplayDom("menu");
      displayDom.style.display = "";
		}; 
    that.exit = function() {
      var displayDom = game.getDisplayDom("menu");
      displayDom.style.display = "none";
		};
    that.render = function(display) {
      //game.getDisplay("menu").drawText(1,1, "%c{yellow}\t __________        __                              ");   
      //game.getDisplay("menu").drawText(1,2, "%c{yellow}\t \\______   \\ _____/  |_  ____ _____ ___  __ ____   "); 
      //game.getDisplay("menu").drawText(1,3, "%c{yellow}\t  |       _//  _ \\   __\\/ ___\\\\__  \\\\  \\/ // __ \\  "); 
      //game.getDisplay("menu").drawText(1,4, "%c{yellow}\t  |    |   (  <_> )  | \\  \\___ / __ \\\\   /\\  ___/  "); 
      //game.getDisplay("menu").drawText(1,5, "%c{yellow}\t  |____|_  /\\____/|__|  \\___  >____  /\\_/  \\___  > ");
      //game.getDisplay("menu").drawText(1,6, "%c{yellow}\t         \\/                 \\/     \\/          \\/  "); 
      //game.getDisplay("menu").drawText(1,8, "          \t\t\t\t\t\t\t\tPress [Enter] to start!");
			
      game.getDisplay("menu").drawText(1,1, "ようこそ-[Enter]-");
      //game.getDisplay("menu").drawText(1,2, "Press [Enter] to start!");

    };
    that.handleInput = function(inputType, inputData) {
      if (inputType === 'keydown') {
        if (inputData.keyCode === ROT.VK_RETURN) {
          game.switchScreen(game.Screen.playScreen);
        }
      }
    };
		return that;
  })();

  that.topScreen = (function (screens) {
		var that = {};
		var selectedRow = 0;
		var menuList = [
			'はじめから',
			'つづきから'
		];
    that.render = function (display) {
			display.drawText(0, 0, 'ようこそ');
			var row = 0;
			for (var i = 0; i < menuList.length; i++) {
			  var letter = letters.substring(i, i + 1);
				var str = "";
				if (i === selectedRow) {
				 	str = "%c{black}%b{white}";
				}
				game.getDisplay('menu').drawText(0, 2 + row, str + letter + '%c{}%b{}' +  ' ' + menuList[i] + '\t\t');
				row++;
			}
		}

    that.handleInput = function (inputType, inputData) {
			if (inputType === 'keydown') {
				//Escapeかアイテムを選択していない状態でEnterを押したときはキャンセル
				if (inputData.keyCode === ROT.VK_ESCAPE || inputData.keyCode === ROT.VK_BACK_SPACE) {  
					screens.playScreen.setSubScreen(undefined);
				} else if (inputData.keyCode === ROT.VK_RETURN) {
					//_that.executeOkFunction();
          screens.playScreen.showItemsSubScreen(menuList[selectedRow], null, "");
				} else if (inputData.keyCode === ROT.VK_UP) {
					if (selectedRow > 0) selectedRow--;
					game.refresh();
				} else if (inputData.keyCode === ROT.VK_DOWN) {
					if (selectedRow < menuList.length-1) selectedRow++;
					game.refresh();
				}
			}
		}
		return that;
	})(that);


  that.messageScreen = (function (){
		var that = {};
    that.render = function(row) {
			//日本語文字表示調整
			var _len = row.length;
		  var str = '';
			for (var j=0; j<_len; j++) {
				str += '\t\t';
			}
			game.getDisplay("message").drawText(1, 1, str);
      game.getDisplay("message").drawText(1, 1, '%c{white}%b{black}' + row);
    };
   	return that;
  })();

  // Define our playing screen
  that.playScreen = (function (){
		var that = {};
		var map = null;
		var player = null;
		that.gameEnded = false;
		var subScreen = null;

		//描画関数
		var draw = function (display, fun) {
		  var filter = fun || function () { return true; };
      var screenWidth = game.getScreenWidth();
			var screenHeight = game.getScreenHeight();

			var topLeftX = Math.max(0, player.getX() - (screenWidth / 2));
			topLeftX = Math.min(topLeftX, map.getWidth() - screenWidth);
			var topLeftY = Math.max(0, player.getY() - (screenHeight / 2));
			topLeftY = Math.min(topLeftY, map.getHeight() - screenHeight);

			var visibleCells = {};
			//var memorizedCells = {}; //プレイヤーが記憶したセル情報
			//var map = map;
			var currentDepth = player.getZ();

			if (subScreen) {
				subScreen.render(display);
				return;
			}

			map.getFov(player.getZ()).compute(
					player.getX(), player.getY(), 
					player.getSightRadius(),
					function(x, y, radius, visibility) {
						visibleCells[x + "," + y] = true;
					  map.setExplored(x, y, currentDepth, true);
						//memorizedCells[x + "," + y + "," + currentDepth] = map.getTile(x, y, currentDepth);
						for (var i = 0; i < 3; i++) {
						  var diff = ROT.DIRS[8][i*2];
							var dx = x + diff[0];
							var dy = y + diff[1];
							var tile = map.getTile(dx, dy, currentDepth);
							if (tile.getName() === 'wallTile') {
						    visibleCells[dx + "," + dy] = true;
							  map.setExplored(dx, dy, currentDepth, true);
						    //memorizedCells[dx + "," + dy + "," + currentDepth] = map.getTile(dx, dy, currentDepth);
							}
					  }	
					});

			//描画のスピードアップのため画面のクリアは階層移動時のみ行う
			var playerTile = map.getTile(player.getX(), player.getY(), player.getZ()); 
			if (['stairsUpTile','stairsDownTile'].indexOf(playerTile.getName()) >= 0) {
			  game.getDisplay().clear();	
			}

			var z = player.getZ();
			var playerX = player.getX();
			var playerY = player.getY();
			var playerSightRadius = player.getSightRadius();
			for (var x = topLeftX; x < topLeftX + screenWidth; x++) {
				for (var y = topLeftY; y < topLeftY + screenHeight; y++) {
					if (filter(x, y, z)) {
			    //if ((['stairsUpTile','stairsDownTile'].indexOf(playerTile.getName()) >= 0) 
					//  ||
					//   ((x >= playerX-playerSightRadius-1 && x <= playerX+playerSightRadius+1) &&
					//    (y >= playerY-playerSightRadius-1 && y <= playerY+playerSightRadius+1))) {
					  var glyph = map.getTile(x, y, z);
					  if (map.isExplored(x, y, z)) {
					    //壁のグラフィック変更
					    var chr = glyph.getChar();
					    //if (map.getTile(x, y, player.getZ()) === game.wallTile) {
					    if (map.getTile(x, y, z).getName() === 'wallTile') {
					  	  //chr = map.getWallChr(x, y, z);
					  	  chr = map.getPartitionChr(x, y, z);
					    }
					  	var foreground = glyph.getForeground();

					  	//if (visibleCells[x + ',' + y]) {
					  	if (visibleCells[x + ',' + y] || map.getMemorizedCell(x,y,z)) {
                var trap = map.getEquipmentAt(x, y, z); 
					  	  if (trap) {
					  	  	glyph = trap;
					  	  	chr = glyph.getChar();
					  	  }
					  	  var items = map.getItemsAt(x, y, z);
								if (items) {
					  	  	glyph = items[items.length -1];
					  	  	chr = glyph.getChar();
					  	  }
					  	  var entity = map.getEntityAt(x, y, z); 
					  	  if (entity) {
					  	  	glyph = entity;
					  	  	chr = glyph.getChar();
					  	  }
					  		foreground = glyph.getForeground();
					  	} else {
					  		//foreground = 'darkGray';
					  		//glyph = map.getMemorizedCell(x, y, z);
					  		//chr = glyph.getChar();
					      //if (map.getTile(x, y, z).getName() === 'wallTile') {
					  	  //  chr = map.getPartitionChr(x, y, z);
					  		//}
					  		//foreground = glyph.getForeground();
					  	}
					  		
					    display.draw(//x, y,
					  	  x - topLeftX,
					  	  y - topLeftY,
					      chr, //glyph.getChar(),
					  	  foreground, //glyph.getForeground(),
					  	  glyph.getBackground()
					    );
					  }
			    }
				}
			}
		}

		var drawTile = function (x, y, z) {
      var glyph = map.getTile(x, y, z);
		  if (map.isExplored(x, y, z)) {
		    //壁のグラフィック変更
		    var chr = glyph.getChar();
		    //if (map.getTile(x, y, player.getZ()) === game.wallTile) {
		    if (map.getTile(x, y, z).getName() === 'wallTile') {
		  	  //chr = map.getWallChr(x, y, z);
		  	  chr = map.getPartitionChr(x, y, z);
		    }
		  	var foreground = glyph.getForeground();

		  	//if (visibleCells[x + ',' + y]) {
		  	if /*(visibleCells[x + ',' + y] ||*/( map.getMemorizedCell(x,y,z)) {
          var trap = map.getEquipmentAt(x, y, z); 
		  	  if (trap) {
		  	  	glyph = trap;
		  	  	chr = glyph.getChar();
		  	  }
		  	  var items = map.getItemsAt(x, y, z);
					if (items) {
		  	  	glyph = items[items.length -1];
		  	  	chr = glyph.getChar();
		  	  }
		  	  var entity = map.getEntityAt(x, y, z); 
		  	  if (entity) {
		  	  	glyph = entity;
		  	  	chr = glyph.getChar();
		  	  }
		  		foreground = glyph.getForeground();
		  	} else {
		  		//foreground = 'darkGray';
		  		//glyph = map.getMemorizedCell(x, y, z);
		  		//chr = glyph.getChar();
		      //if (map.getTile(x, y, z).getName() === 'wallTile') {
		  	  //  chr = map.getPartitionChr(x, y, z);
		  		//}
		  		//foreground = glyph.getForeground();
		  	}
		  		
		    game.getDisplay().draw( //MainDisplay
		  	  x,
		  	  y,
		      chr, //glyph.getChar(),
		  	  foreground, //glyph.getForeground(),
		  	  glyph.getBackground()
		    );
		  }
		}

    that.enter = function() { 
			var displayDom = game.getDisplayDom("main");
			displayDom.style.display = "";
			var width  = game.getScreenWidth(); //100; 
			var height = game.getScreenHeight(); //48;
			var depth = 22;//10;

			//TODO: タイルとプレイヤー(あとエンティティ)の情報はサーバーから受け取ることにする
			//var tiles = Builder(game, width, height, depth).getTiles();
			var tiles = Builder(width, height, depth).getTiles();
			
			//player = Entity(game.PlayerTemplate);
			player = Character(game.PlayerTemplate);

			map = Map(tiles, player);

			draw(game.getDisplay());

      //var z = player.getZ();
			//for (var x = 0; x < width; x++) {
			//	for (var y = 0; y < height; y++) {
			//		drawTile(x, y, z);
			//	}
			//}
      
			window.addEventListener('beforeunload', function(e) {
				if (player.isAlive()) {
				  map.saveData();
					player.saveData();
				} else {
					map.clearData();
					player.clearData();
				}
      }, false);

			map.getEngine().start();
			//リアルタイムで動かす。１ラウンド１秒
			/* リアルタイム処理
			setInterval(function () {
				//TODO: サーバーからmap配列を受け取る処理を書く
				//map.getEngine().lock();
				map.getEngine().unlock();
				game.refresh();
				//TODO: サーバーへmap配列を送る処理を書く
				//mapオブジェクトの中に受信と送信のメソッドを書く
				//pipe.sendMap(map);
			}, 1000);
			*/
		};

		that.exit = function() { console.log("Exited play screen."); };

    that.render = function(display) {
      var playerTile = map.getTile(player.getX(), player.getY(), player.getZ()); 
      var playerX = player.getX();
			var playerY = player.getY();
			var playerSightRadius = player.getSightRadius();
			draw(display, function (x, y, z) {
        return ((['stairsUpTile','stairsDownTile'].indexOf(playerTile.getName()) >= 0) 
					  ||
					   ((x >= playerX-playerSightRadius-1 && x <= playerX+playerSightRadius+1) &&
					    (y >= playerY-playerSightRadius-1 && y <= playerY+playerSightRadius+1)));
			});

			//var screenWidth = game.getScreenWidth();
			//var screenHeight = game.getScreenHeight();

			//var topLeftX = Math.max(0, player.getX() - (screenWidth / 2));
			//topLeftX = Math.min(topLeftX, map.getWidth() - screenWidth);
			//var topLeftY = Math.max(0, player.getY() - (screenHeight / 2));
			//topLeftY = Math.min(topLeftY, map.getHeight() - screenHeight);

			//var visibleCells = {};
			////var memorizedCells = {}; //プレイヤーが記憶したセル情報
			////var map = map;
			//var currentDepth = player.getZ();

			//if (subScreen) {
			//	subScreen.render(display);
			//	return;
			//}

			//map.getFov(player.getZ()).compute(
			//		player.getX(), player.getY(), 
			//		player.getSightRadius(),
			//		function(x, y, radius, visibility) {
			//			visibleCells[x + "," + y] = true;
			//		  map.setExplored(x, y, currentDepth, true);
			//			//memorizedCells[x + "," + y + "," + currentDepth] = map.getTile(x, y, currentDepth);
			//			for (var i = 0; i < 3; i++) {
			//			  var diff = ROT.DIRS[8][i*2];
			//				var dx = x + diff[0];
			//				var dy = y + diff[1];
			//				var tile = map.getTile(dx, dy, currentDepth);
			//				if (tile.getName() === 'wallTile') {
			//			    visibleCells[dx + "," + dy] = true;
			//				  map.setExplored(dx, dy, currentDepth, true);
			//			    //memorizedCells[dx + "," + dy + "," + currentDepth] = map.getTile(dx, dy, currentDepth);
			//				}
			//		  }	
			//		});

			////描画のスピードアップのため画面のクリアは階層移動時のみ行う
			//var playerTile = map.getTile(player.getX(), player.getY(), player.getZ()); 
			//if (['stairsUpTile','stairsDownTile'].indexOf(playerTile.getName()) >= 0) {
			//  game.getDisplay().clear();	
			//}

			//var z = player.getZ();
			//var playerX = player.getX();
			//var playerY = player.getY();
			//var playerSightRadius = player.getSightRadius();
			//for (var x = topLeftX; x < topLeftX + screenWidth; x++) {
			//	for (var y = topLeftY; y < topLeftY + screenHeight; y++) {
			//    if ((['stairsUpTile','stairsDownTile'].indexOf(playerTile.getName()) >= 0) 
			//		  ||
			//		   ((x >= playerX-playerSightRadius-1 && x <= playerX+playerSightRadius+1) &&
			//		    (y >= playerY-playerSightRadius-1 && y <= playerY+playerSightRadius+1))) {
			//		  var glyph = map.getTile(x, y, z);
			//		  if (map.isExplored(x, y, z)) {
			//		    //壁のグラフィック変更
			//		    var chr = glyph.getChar();
			//		    //if (map.getTile(x, y, player.getZ()) === game.wallTile) {
			//		    if (map.getTile(x, y, z).getName() === 'wallTile') {
			//		  	  //chr = map.getWallChr(x, y, z);
			//		  	  chr = map.getPartitionChr(x, y, z);
			//		    }
			//		  	var foreground = glyph.getForeground();

			//		  	//if (visibleCells[x + ',' + y]) {
			//		  	if (visibleCells[x + ',' + y] || map.getMemorizedCell(x,y,z)) {
      //          var trap = map.getEquipmentAt(x, y, z); 
			//		  	  if (trap) {
			//		  	  	glyph = trap;
			//		  	  	chr = glyph.getChar();
			//		  	  }
			//		  	  var items = map.getItemsAt(x, y, z);
			//					if (items) {
			//		  	  	glyph = items[items.length -1];
			//		  	  	chr = glyph.getChar();
			//		  	  }
			//		  	  var entity = map.getEntityAt(x, y, z); 
			//		  	  if (entity) {
			//		  	  	glyph = entity;
			//		  	  	chr = glyph.getChar();
			//		  	  }
			//		  		foreground = glyph.getForeground();
			//		  	} else {
			//		  		//foreground = 'darkGray';
			//		  		//glyph = map.getMemorizedCell(x, y, z);
			//		  		//chr = glyph.getChar();
			//		      //if (map.getTile(x, y, z).getName() === 'wallTile') {
			//		  	  //  chr = map.getPartitionChr(x, y, z);
			//		  		//}
			//		  		//foreground = glyph.getForeground();
			//		  	}
			//		  		
			//		    display.draw(//x, y,
			//		  	  x - topLeftX,
			//		  	  y - topLeftY,
			//		      chr, //glyph.getChar(),
			//		  	  foreground, //glyph.getForeground(),
			//		  	  glyph.getBackground()
			//		    );
			//		  }
			//    }
			//	}
			//}

			var stats = '%c{white}%b{#1C1C1C}';
			stats += vsprintf('地下:%d階\t', [player.getZ()+1]);
			stats += '  ';
			stats += vsprintf('HP:%d/%d\t', [player.getHp(), player.getMaxHp()]);
			stats += '  ';
			stats += vsprintf('AC:%d\t', [player.getAC()]);
			stats += '  ';
			stats += vsprintf('Str:%d\t', [player.getStr()]);
			stats += '  ';
			stats += vsprintf('Con:%d\t', [player.getCon()]);
			stats += '  ';
			stats += vsprintf('Dex:%d\t', [player.getDex()]);
			//stats += vsprintf('LUC:%d\t', [player.getLuc()]);
			//stats += vsprintf('WIZ:%d\t', [player.getWiz()]);
			stats += vsprintf('%s\t', [player.getHungerState()]);
			game.getDisplay('sub').drawText(1, 0, stats);
			//display.drawText(0, screenHeight+1, stats);

			//var hungerState = player.getHungerState()+'\t';
			//display.drawText(screenWidth - hungerState.length*2, screenHeight, hungerState);
			//display.drawText(screenWidth - hungerState.length*2, screenHeight+1, hungerState);
      game.Screen.messageScreen.render(player.getMessage());
      player.messages(_.rest(player.messages()));

			//var messages = player.getMessages();
			//var messageY = 0;
			//var len = messages.length;
			//for (var i=0; i<len; i++) {
			//	//日本語文字表示調整
			//	var _len = messages[i].length;
			//	var str = '';
			//	for (var j=0; j<_len; j++) {
			//		//str = str + '\t\t';
			//		str += '\t\t';
			//	}
			//	display.drawText(0, messageY, str);
			//	  	
			//	messageY += display.drawText(
			//			0,
			//			messageY,
			//			'%c{white}%b{black}' + messages[i]
			//	);
			//}
    };
	  var move = function (dx, dy, dz) {
			var newX = player.getX() + dx;
			var newY = player.getY() + dy;
			var newZ = player.getZ() + dz;
			player.tryMove(newX, newY, newZ);
		};
		var fire = function (dx, dy, dz) {
			console.log('Fire!');
			var newX = player.getX() + dx;
			var newY = player.getY() + dy;
			var newZ = player.getZ() + dz;ar 
			player.tryFire(newX, newY, newZ);
		};
    that.handleInput = function(inputType, inputData) {
			//メッセージ出力
			if (!_.isEmpty(player.messages())) {
				if (inputType === 'keydown') {
				  game.refresh();
				  return;
				}
			}

			if (that.gameEnded) {
				if (inputType === 'keydown' && inputData.keyCode === ROT.VK_RETURN) {
          game.switchScreen(game.Screen.loseScreen);
				}
		    return;
			}	
			if (subScreen) {
				subScreen.handleInput(inputType, inputData);
				return;
			}
		  	
      if (inputType === 'keydown') {
        if (inputData.keyCode === ROT.VK_RETURN) { //Enterでアイテム拾いとメニュー画面表示
          var items = map.getItemsAt(player.getX(), player.getY(), player.getZ());
					if (!items) { //落ちているアイテムがない場合はメニューを表示させる
						if (game.Screen.inventoryScreen.setup(player, map, player.getItems())) {
					  	that.setSubScreen(game.Screen.inventoryScreen);
					  } else {
					  	game.refresh();
					  }
					} else if (items.length === 1) {
						var item = items[0];
						var describe = item.describeTotal();
						if (player.pickupItems(map, [0])) {
							Message.sendMessage(player, "%sを拾った", [describe]);
						} else {
							Message.sendMessage(player, "背負い袋はいっぱいだ。これ以上持つことはできない");
						}
					} else {
						game.Screen.pickupScreen.setup(player, map, items);
						that.setSubScreen(game.Screen.pickupScreen);
						return;
					}
        } else if (inputData.keyCode === ROT.VK_ESCAPE) {
          //game.switchScreen(game.Screen.loseScreen);
        } else if (inputData.keyCode === ROT.VK_LEFT || inputData.keyCode === ROT.VK_H) {
          if (inputData.shiftKey) {
						fire(-1, 0, 0);
					} else {
				    move(-1, 0, 0);
					}
				} else if (inputData.keyCode === ROT.VK_RIGHT || inputData.keyCode === ROT.VK_L) {
          if (inputData.shiftKey) {
						fire(1, 0, 0);
					} else {
					  move(1, 0, 0);
					}
				} else if (inputData.keyCode === ROT.VK_UP || inputData.keyCode === ROT.VK_K) {
          if (inputData.shiftKey) {
						fire(0, -1, 0);
					} else {
					  move(0, -1, 0);
					}
				} else if (inputData.keyCode === ROT.VK_DOWN || inputData.keyCode === ROT.VK_J) {
          if (inputData.shiftKey) {
						fire(0, 1, 0);
					} else {
					  move(0, 1, 0);
					}
				} else if (inputData.keyCode === ROT.VK_BACK_SPACE) {
				  that.setSubScreen(game.Screen.menuScreen);
				} else if (inputData.keyCode === ROT.VK_I) {
					that.showItemsSubScreen(game.Screen.inventoryScreen, player.getItems(), 
							"何も持っていない");
					return;
				} else if (inputData.keyCode === ROT.VK_D) {
          that.showItemsSubScreen(game.Screen.dropScreen, player.getItems(), 
							"何も持っていない");
					return;
				} else if (inputData.keyCode === ROT.VK_E) {
					that.showItemsSubScreen(game.Screen.eatScreen, player.getItems(), 
							"食べられるものを持っていない");
					return;
				} else if (inputData.keyCode === ROT.VK_W) {
					if (inputData.shiftKey) {
            that.showItemsSubScreen(game.Screen.wearScreen, player.getItems(), 
							"装備できる防具を持っていない");
					} else {
            that.showItemsSubScreen(game.Screen.wieldScreen, player.getItems(), 
							"装備できる武器を持っていない");
					}
					return;
				} else if (inputData.keyCode === ROT.VK_COMMA) {
					var items = map.getItemsAt(player.getX(), player.getY(), player.getZ());
					if (!items) {
						//TODO: 何もないことを示すメッセージを出す
					} else if (items.length === 1) {
						var item = items[0];
						var describe = item.describeTotal();
						if (player.pickupItems(map, [0])) {
							Message.sendMessage(player, "%sを拾った", [describe]);
						} else {
							Message.sendMessage(player, "背負い袋はいっぱいだ。これ以上持つことはできない");
						}
					} else {
            that.showItemsSubScreen(game.Screen.pickupScreen, items, "");
					}
        } else if (inputData.keyCode === ROT.VK_Z) { //デバッグ(階層移動)
		  		player.setPosition(player.getX(), player.getY(), player.getZ()+1);
					return;
				} else {
					return;
				}
				/*リアルタイム処理
				game.refresh();
				*/
				map.getEngine().unlock();
      } else if (inputType === 'keypress') {
				var keyChar = String.fromCharCode(inputData.charCode);
				if (keyChar === '>') {
					move(0, 0, 1);
				} else if (keyChar === '<') {
					move(0, 0, -1);
				} else {
					return;
				}
				/*リアルタイム処理
				game.refresh();
				*/
				map.getEngine().unlock();
			}
    };
		that.showItemsSubScreen = function (subScreen, items, emptyMessage) {
			var items = player.getItems();
			if (items && subScreen.setup(player, map, items) > 0) {
				that.setSubScreen(subScreen);
			} else {
				Message.sendMessage(this.player, emptyMessage);
				game.refresh();
			}
		};
		that.setGameEnded = function(_gameEnded) {
			that.gameEnded = _gameEnded;
		};
		that.setSubScreen = function (_subScreen) {
      var mainDom = game.getDisplayDom("main");
      var menuDom = game.getDisplayDom("menu");
			if (_subScreen) {
        menuDom.style.display = "";
        mainDom.style.display = "none";
			} else {
        menuDom.style.display = "none";
        mainDom.style.display = "";
			}
			subScreen = _subScreen;
			game.refresh();
		};
		return that;
	})();

	
	var ItemListScreen = function (template) {
		var _that = {};

		var caption = template.caption;
		var help = template.help;
		_that.okFunction = template.ok;

		//アイテムリストを開けるかどうかを返す関数(デフォルトはアイテムを持っているか)
		_that.isAcceptableFunction = template.isAcceptable || function (x) {return x; }
		var canSelectItem = template.canSelect;
		var canSelectMultipleItems = template.canSelectMultipleItems;

		_that.player = null;
		_that.map = null;
		_that.items = null;
		_that.selectedIndices = {};
		_that.selectedRow = 0;

		_that.getCaption = function () {
			return caption;
		}

		_that.setup = function (player, map, items) {
			_that.player = player;
			_that.map = map;
			//_that.items = items;
			var count = 0;
			//var items = hands.concat(items);
			//_that.items = _.filter(items, function (item) {
			_that.items = _.map(items, function (item) {
				if (_that.isAcceptableFunction(item)) {
					count++;
					return item;
				} else {
					return null;
				}
			});

			//_that.items = items.map(function(item) {
			//	if (_that.isAcceptableFunction(item)) {
			//		count++;
			//		return item;
			//	} else {
			//		//return null;
			//	}
			//});
			_that.selectedIndices = {};
			return count;
		}

		_that.render = function (display) {
			var letters = 'abcdefghijklmnopqrstuvwxyz';

			//display.drawText(0, 0, caption);
			var row = 0;
			for (var i = 0; i < _that.items.length; i++) {
				if (_that.items[i]) {
					var letter = letters.substring(i, i + 1);
					var selectionState = (canSelectItem && canSelectMultipleItems && _that.selectedIndices[i]) ? '+' : '-';
					var str = "";
					if (i === _that.selectedRow) {
					 	str = "%c{black}%b{white}";
					}
					var item = _that.items[i];
					//display.drawText(0, 2 + row, str + letter + '%c{}%b{}' + ' ' + selectionState + ' ' + item.describeTotal() + '\t\t');
					game.getDisplay('menu').drawText(0, 1 + row, str + letter + '%c{}%b{}' + ' ' + selectionState + ' ' + item.describeTotal() + '\t\t');
					row++;
				}
			}
		}

		_that.executeOkFunction = function () {
			var selectedItems = {};
			for (var key in _that.selectedIndices) {
		    selectedItems[key] = _that.items[key];
			}
						game.Screen.playScreen.setSubScreen(undefined);
			if (_that.okFunction(selectedItems)) {
				_that.player.getMap().getEngine().unlock();
			}
		}
		

		_that.handleInput = function (inputType, inputData) {
			if (inputType === 'keydown') {
				//Escapeかアイテムを選択していない状態でEnterを押したときはキャンセル
				if (inputData.keyCode === ROT.VK_ESCAPE || inputData.keyCode === ROT.VK_BACK_SPACE) { 
						//(inputData.keyCode === ROT.VK_RETURN && (!canSelectItem || Object.keys(_that.selectedIndices).length === 0))) {
					game.Screen.playScreen.setSubScreen(undefined);
				} else if (canSelectItem && inputData.keyCode === ROT.VK_RETURN) {
          var index = _that.selectedRow;
					if (!canSelectMultipleItems) {
            _that.selectedIndices[index] = true;
					}
					_that.executeOkFunction();
				} else if (inputData.keyCode === ROT.VK_UP) {
					if (_that.selectedRow > 0) _that.selectedRow--;
					game.refresh();
				} else if (inputData.keyCode === ROT.VK_DOWN) {
					if (_that.selectedRow < _that.items.length-1) _that.selectedRow++;
					game.refresh();
				} else if ((canSelectItem && inputData.keyCode === ROT.VK_SPACE) ||
						(canSelectItem && inputData.keyCode >= ROT.VK_A && inputData.keyCode <= ROT.VK_Z)) {
					if (inputData.keyCode === ROT.VK_SPACE) { //スペースのときはカーソルのあるアイテムを選択
            var index = _that.selectedRow;
					} else {
					  var index = inputData.keyCode - ROT.VK_A; //スペース以外はその文字のアイテムを選択
					}
					if (_that.items[index]) {
						if (canSelectMultipleItems) {
							if (_that.selectedIndices[index]) {
								delete _that.selectedIndices[index];
							} else {
								_that.selectedIndices[index] = true;
							}
							game.refresh();
						} else {
							_that.selectedIndices[index] = true;
							_that.executeOkFunction();
						}
					}
				}
			}
		}
		return _that;
	}

	that.inventoryScreen = ItemListScreen({
		caption: '持ち物を確認する',
		help: '持ち物',
	  canSelect: false
	});

	that.pickupScreen = ItemListScreen({
		caption: '拾う',
		help: 'どれを拾いますか？',
		canSelect: true,
		canSelectMultipleItems: true,
		ok: function(selectedItems) {
			if (!this.player.pickupItems(this.map, Object.keys(selectedItems))) {
				//TODO: もう持てないことを示すメッセージを出す
			}
			return true;
		}
	});

	that.dropScreen = ItemListScreen({
		caption: '捨てる',
		help: 'どれを捨てますか？',
		canSelect: true,
		canSelectMultipleItems: false,
		ok: function(selectedItems) {
			this.player.dropItem(this.map, Object.keys(selectedItems)[0]);
			return true;
		}
	});

	that.eatScreen = ItemListScreen({
		caption: '食べる',
		help: 'どれを食べますか？',
		canSelect: true,
		canSelectMultipleItems: false,
		isAcceptable: function(item) {
			return item && item.hasMixin('Edible');
		},
		ok: function(selectedItems) {
			var key = Object.keys(selectedItems)[0];
			var item = selectedItems[key];
			Message.sendMessage(this.player, "%sを食べた", [item.describe()]);
			item.eat(this.player);
			this.player.removeItem(key);
			//if (!item.hasRemainingConsumptions()) {
			//	this.player.removeItem(key);
			//}
			return true;
		}
	});

	that.wieldScreen = ItemListScreen({
		caption: '装備する武器を選んでください',
		help: 'どれを装備しますか？',
	  canSelect: true,
		canSelectMultipleItems: false,
		//hasNoItemOption: true,
		isAcceptable: function (item) {
			return item && item.hasMixin('Equippable') && item.isWieldable();
		},
		ok: function (selectedItems) {
			var keys = Object.keys(selectedItems);
			if (keys.length === 0) {
				Message.sendMessage(this.player, "あなたは手を空けた");
			} else {
				var item = selectedItems[keys[0]];
				var key = keys[0];
				Message.sendMessage(this.player, "%sを装備した", [item.describe()]);
				//this.player.unequip(item);
				this.player.wield(item, key);
			}
			return true;
		}
	});	

  that.wearScreen = ItemListScreen({
		caption: '装備する防具を選んでください',
		help: 'どれを装備しますか？',
	  canSelect: true,
		canSelectMultipleItems: false,
		//hasNoItemOption: true,
		isAcceptable: function (item) {
			return item && item.hasMixin('Equippable') && item.isWearable();
		},
		ok: function (selectedItems) {
			var keys = Object.keys(selectedItems);
			if (keys.length === 0) {
				this.player.takeOff();
				Message.sendMessage(this.player, "何も装備していない");
			} else {
				var item = selectedItems[keys[0]];
				Message.sendMessage(this.player, "%sを装備した", [item.describe()]);
        //this.player.unequip(item);
				this.player.wear(item);
			}
			return true;
		}
	});	

	that.equipScreen = ItemListScreen({
		caption: '装備する',
		help: 'どれを装備しますか？',
    canSelect: true,
		canSelectMultipleItems: false,
		//hasNoItemOption: true,
		isAcceptable: function (item) {
			return item && item.hasMixin('Equippable');
		},
		ok: function (selectedItems) {
			var keys = Object.keys(selectedItems);
			if (keys.length === 0) {
				//this.player.unwield();
			} else {
				var item = selectedItems[keys[0]];
				var key = keys[0];
				if (item.getEquipState()) {
				  Message.sendMessage(this.player, "それはすでに装備している");
				} else {
				  Message.sendMessage(this.player, "%sを装備した", [item.describe()]);
				  this.player.equip(item, key);
				}
			}
			return true;
		}
	});

	//メニュースクリーン
  that.menuScreen = (function (screens) {
		var that = {};
		var selectedRow = 0;
		var menuList = [
			screens.inventoryScreen,
			screens.dropScreen,
			screens.eatScreen,
			screens.equipScreen
		];
    that.render = function (display) {
			var letters = 'abcdefghijklmnopqrstuvwxyz';

			display.drawText(0, 0, 'どうしますか？');
			var row = 0;
			for (var i = 0; i < menuList.length; i++) {
			  var letter = letters.substring(i, i + 1);
				var str = "";
				if (i === selectedRow) {
				 	str = "%c{black}%b{white}";
				}
				var screen = menuList[i];
				game.getDisplay('menu').drawText(0, 2 + row, str + letter + '%c{}%b{}' +  ' ' + screen.getCaption() + '\t\t');
				row++;
			}
		}

    that.handleInput = function (inputType, inputData) {
			if (inputType === 'keydown') {
				//Escapeかアイテムを選択していない状態でEnterを押したときはキャンセル
				if (inputData.keyCode === ROT.VK_ESCAPE || inputData.keyCode === ROT.VK_BACK_SPACE) {  
					screens.playScreen.setSubScreen(undefined);
				} else if (inputData.keyCode === ROT.VK_RETURN) {
					//_that.executeOkFunction();
          screens.playScreen.showItemsSubScreen(menuList[selectedRow], null, "");
				} else if (inputData.keyCode === ROT.VK_UP) {
					if (selectedRow > 0) selectedRow--;
					game.refresh();
				} else if (inputData.keyCode === ROT.VK_DOWN) {
					if (selectedRow < menuList.length-1) selectedRow++;
					game.refresh();
				}
			}
		}
		return that;
	})(that);

  // Define our winning screen
  that.winScreen = (function (){
		var that = {};
    that.enter = function() { console.log("Entered win screen."); };
    that.exit = function() { console.log("Exited win screen."); };
    that.render = function(display) {
      // Render our prompt to the screen
      for (var i = 0; i < 22; i++) {
        // Generate random background colors
        var r = Math.round(Math.random() * 255);
        var g = Math.round(Math.random() * 255);
        var b = Math.round(Math.random() * 255);
        var background = ROT.Color.toRGB([r, g, b]);
          display.drawText(2, i + 1, "%b{" + background + "}You win!");
      }
    };
    that.handleInput = function(inputType, inputData) {
        // Nothing to do here      
    };
		return that;
  })();

  // Define our winning screen
  that.loseScreen = (function (){
		var that = {};
    that.enter = function() { console.log("Entered lose screen."); };
    that.exit = function() { console.log("Exited lose screen."); };
    that.render = function(display) {
      // Render our prompt to the screen
      //display.drawText(2, i + 1, "%b{red}You lose! :(");
      display.drawText(2, 1, "GAME OVER");
    };
    that.handleInput = function(inputType, inputData) {
        // Nothing to do here      
    };
		return that;
  })();

	return that;
};

module.exports = {
	Screen: Screen
};
