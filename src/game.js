"use strict";


var Game = (function () {
	var that = {};
	var Screen = require('./screens').Screen;
	var Glyph  = require('./glyph').Glyph;
	var Tile   = require('./tile').Tile;
	var Mixins = require('./entitymixins').EntityMixins;
	var Monsters = require('./monsters').Monsters;
	var Dice = require('./dice').Dice();
	var currentScreen = null;
	var message = "";

  var dom = {};
  that.defBackground = "#1C1C1C";
  
	that.display = null;
  that.Screen = Screen(that);

	that.PlayerTemplate = {
		character: '@',
		foreground: 'white',
		background: that.defBackground,
		maxHp: 10,
		attackValue: 3,
		defenseValue: 3,
		damage: Dice.xdx(1, 2),
		ac: 9,
		//speed: 110,
		sightRadius: 6, //20, //6, //5,//10, //6,
		healCount: 15,
		mixins: [Mixins.PlayerActor(that),
		         Mixins.Attacker, Mixins.Destructible,
						 Mixins.InventoryHolder, Mixins.FoodConsumer,
		         Mixins.Sight, Mixins.MessageRecipient,
		         Mixins.Equipper]
	}
	
	that.map = Map;

	that.screenWidth = 36;//32; //75; //80;
	that.screenHeight = 16;//16; //35;//42; //40; //24;

	that.getScreenWidth  = function () { return that.screenWidth; }
	that.getScreenHeight = function () { return that.screenHeight; }
				
	that.init = function(tileSet) {
    var tileSet = document.getElementById('tileSet'); 
   
		var tw = 15;
		var th = 15;
    var options = {
        layout: "tile",
        bg: that.defBackground, //"#222",//"black",
        tileWidth: tw,
        tileHeight: th,
        tileSet: tileSet ,
        tileMap: {
					  "	": [tw*64,  th*64 ],
					  " ": [tw*64,  th*64 ],
            "@": [tw*0,  th*4 ],
						".": [tw*14, th*2 ],
						"+": [tw*11, th*2 ],
						"░": [tw*0,  th*11],
						">": [tw*14, th*3 ],
						"<": [tw*12, th*3 ],
            "│": [tw*3,  th*11],
            "─": [tw*4,  th*12],
            "┘": [tw*9,  th*13],
            "└": [tw*0,  th*12],
            "┐": [tw*15, th*11],
            "┌": [tw*10, th*13],
						"♠": [tw*6,  th*0 ],
						"‼️": [tw*3,  th*1 ],
						"■": [tw*14, th*15],
						//"F": [tw*, th*],
						//"p": [tw*, th*],
						//"r": [tw*, th*],
						//"k": [tw*, th*],
            //"B": [tw*2,  th*5 ]
						//"o": [tw*, th*],
        },
				tileColorize: true,
        width: that.screenWidth,
        height: that.screenHeight//+2
    }
		var index = 32;
		for (var w=0; w<16; w++) {
			options.tileMap[String.fromCharCode(index)] = [tw*w, th*2];
			index++;
		}
		var index = 64;
		for (var h=4; h<8; h++) {
	  	for (var w=0; w<16; w++) {
				options.tileMap[String.fromCharCode(index)] = [tw*w, th*h];
				index++;
			}
		}
		options.tileMap['!'] = [tw*13, th*10];

		//var options2 = {bg: "#1C1C1C", width: 125, height: 2, fontSize: 18};
		//var options3 = {bg: "#1C1C1C", width: 125, height: that.screenHeight, fontSize: 18};
		var options2 = {bg: that.defBackground, width: 80, height: 2, /*spacing: 1.2,*/ fontSize: 18};
		var options3 = {bg: that.defBackground, width: 80, height: 21, /*spacing: 1.2,*/ fontSize: 18};
		//var options2 = {bg: "#1C1C1C", width: 62, height: 2, fontFamily: "Nico Moji", spacing: 1.2, fontSize: 18};
		//var options3 = {bg: "#1C1C1C", width: 62, height: 20, fontFamily: "Nico Moji", spacing: 1.2, fontSize: 18};

    //that.display = new ROT.Display({width: that.screenWidth, height: that.screenHeight+2});
		that.display = {};
    that.display.message = new ROT.Display(options2);
    //that.display.main = new ROT.Display(options);
    that.display.main = new ROT.Display({fontSize: 32, bg: that.defBackground, width: that.screenWidth, height: that.screenHeight+2});
    that.display.menu = new ROT.Display(options3);
    that.display.sub = new ROT.Display(options2);
		
	  var bindEventToScreen = function(event) {
	    window.addEventListener(event, function(e) {
	      if (currentScreen !== null) {
	        currentScreen.handleInput(event, e);
	      }
	    });

    }
	  bindEventToScreen('keydown');
	  bindEventToScreen('keypress');

    dom.message = document.body.appendChild(that.getDisplay("message").getContainer());
    dom.main    = document.body.appendChild(that.getDisplay("main").getContainer());
    dom.menu    = document.body.appendChild(that.getDisplay("menu").getContainer());
    dom.sub     = document.body.appendChild(that.getDisplay("sub").getContainer());
	  dom.main.style.display = "none";
    dom.menu.style.display = "none";

		that.getDisplay().clear();
		//$('.screen').append(that.getDisplay().getContainer());
    that.switchScreen(that.Screen.startScreen);
	}

	that.getDisplayDom = function (type) {
		return dom[type];
	};
  
	that.refresh = function () {
		that.getDisplay().clear();
		that.getDisplay("message").clear();
		that.getDisplay("menu").clear();
		that.getDisplay("sub").clear();
		currentScreen.render(that.getDisplay());
	}

	that.getDisplay = function(type) {
		type = type || "main";
		return that.display[type];
		//return that.display;
	}

	that.switchScreen = function(screen) {
	  if (currentScreen !== null) {
	    currentScreen.exit();
	  }
	  that.getDisplay().clear();

	  currentScreen = screen;
	  if (!currentScreen !== null) {
	    currentScreen.enter();
			that.refresh();
	  }
	}

	that.getNeighborPositions = function (x, y) {
		var tiles = [];
		for (var dx = -1; dx < 2; dx++) {
			for (var dy = -1; dy < 2; dy++) {
				if (dx == 0 && dy == 0) {
					continue;
				}
				tiles.push({x: x+dx, y: y+dy});
			}
		}
		return tiles.randomize();
	}
	
	return that;
})();

Game.init();




