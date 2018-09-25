var Message = function () {
	var that = {};

  that.sendMessage = function (recipient, message, args) {
		if (recipient.hasMixin("MessageRecipient")) {
			if (args) {
				message = vsprintf(message, args);
			}
			recipient.receiveMessage(message);
		}
	}

	that.sendMessageNearby = function (map, centerX, centerY, centerZ, message, args) {
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

	return that;
}

module.exports = {
	Message: Message
}

