'use strict';

var _ = require('lodash');

var validationRules = require('./rules');

function Validation(options){
	this.lexicon = options.lexicon;
	var rules = validationRules;
	if(options.rules){
		rules = _.assign({}, validationRules, options.rules);
	}
	this.rules = rules;
}
// todo: I should not care about require that will get taken care of in the validator side
_.assign(Validation.prototype, {
	validate: function(value, data, property, options){
		var _this = this;
		var success = true;
		var error;

		_.each(property.validation, function(validation){
			var rule = _this.rules[validation.type];
			var errorArgs = [value].concat(validation.arguments);
			if(!rule){
				throw new Error('Rule ' + validation.type + ' does not exist');
			}else if(rule.validate instanceof RegExp){
				if(!value.match(rule.validate)){
					success = false;
					error = _this.getErrorMessage(rule.message, errorArgs);
					return false;
				}
			}else if(_.isFunction(rule.validate)){
				var args = [value, {data: data, property: property, options: options}].concat(validation.arguments);
				if(!rule.validate.apply(rule, args)){
					success = false;
					error = _this.getErrorMessage(rule.message, errorArgs);
					return false;
				}
			}else{
				throw new Error('Invalid rule.validate');
			}
		});
		return {
			success: success,
			error: error
		};
	},
	getErrorMessage: function(key, args){
		return {
			id: key,
			value: (this.lexicon[key] || key).replace(/\{(\d)}/g, function(match, _index){
				var index = Number(_index);
				return args[index];
			})
		};
	}
});

module.exports = Validation;
