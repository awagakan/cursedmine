var Repository = function(_name, _ctor, _filter) {
	var that = {};

	var name = _name;
	var templates = {};
	var ctor = _ctor;
	var randomTemplates = {};
	var filter = _filter || function () { return true; };

	that.define = function(_name, _template, option) {
		_template.idName = _name;
		templates[_name] = _template;
		var disableRandomCreation = option && option.disableRandomCreation;
		if (!disableRandomCreation && filter(_template)) {
			randomTemplates[_name] = _template;
		}
	}

	that.create = function(_name, extraProperties) {
		if (!templates[_name]) {
			throw new Error("No template named '" + _name + "' in repository '" + name + "'");
		}
		//var template = templates[_name];
		var template = Object.create(templates[_name]);
		if (extraProperties) {
			for (var key in extraProperties) {
				template[key] = extraProperties[key];
			}
		}
		return ctor(template);
	}

	that.createRandom = function() {
	  return that.create(Object.keys(randomTemplates).random());
	}

	return that;
}

module.exports = {
	Repository: Repository
}
		
