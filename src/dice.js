var Dice = function () {
	var that = {};
	
	that.xdx = function (time, dice) {
		return function () {
			var role = 0;
			for (var i=0; i<time; i++) {
		    role += 1 + Math.floor(Math.random() * dice);
			}
			return role;
		};
	};

	that.d20 = that.xdx(1, 20);

	return that;
}
module.exports = {
	Dice: Dice
}
