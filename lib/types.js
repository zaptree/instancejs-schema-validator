'use strict';

var _ = require('lodash');

module.exports = {
	// todo: I can add an objectId type that automatically converts the string to an actual objectId
	'bool': 'boolean',
	'boolean': {
		cast: function (value) {
			if(_.isBoolean(value)){
				return value;
			}else if(value === 1 || value === 'true' || value ==='1'){
				return true;
			}else if(value === 0 || value ==='false' || value ==='0' || !value){
				return false;
			}
			return value;
		},
		validate: function (value) {
			var result = {
				success: true,
				value: value
			};
			if (!_.isBoolean(value)) {
				result.success = false;
				result.error = 'VALIDATION_ERROR_NOT_BOOLEAN';
			}
			return result;
		}
	},
	'string': {
		cast: function (value) {
			if(_.isNumber(value) || _.isBoolean(value)){
				return value.toString();
			}else if(!value){
				return '';
			}
			return value;
		},
		validate: function (value) {
			var result = {
				success: true,
				value: value
			};
			if (!_.isString(value)) {
				result.success = false;
				result.error = 'VALIDATION_ERROR_NOT_STRING';
			}
			return result;
		}
	},
	'int': 'integer',
	'integer': {
		cast: function (_value) {
			if(!_.isNumber(_value) || isNaN(_value)){
				var value = Number(_value);
				if(_.isNumber(value) && !isNaN(value)){
					return value | 0;
				}
				return _value;
			}
			return _value | 0;
		},
		validate: function (value) {
			var result = {
				success: true,
				value: value
			};
			if (!_.isInteger(value)) {
				result.success = false;
				result.error = 'VALIDATION_ERROR_NOT_INTEGER';
			}
			return result;
		}
	},
	'number': 'float',
	'float': {
		cast: function (_value) {
			if(!_.isNumber(_value) || isNaN(_value)){
				var value = Number(_value);
				if(_.isNumber(value) && !isNaN(value)){
					return value;
				}
			}
			return _value;
		},
		validate: function (value) {
			var result = {
				success: true,
				value: value
			};
			if (!_.isNumber(value)) {
				result.success = false;
				result.error = 'VALIDATION_ERROR_NOT_NUMBER';
			}
			return result;
		}
	},
	'object': {
		cast: function (value) {
			return value;
		},
		validate: function (value) {
			var result = {
				success: true,
				value: value
			};
			if (!_.isObject(value)) {
				result.success = false;
				result.error = 'VALIDATION_ERROR_NOT_OBJECT';

			}
			return result;
		}
	},
	'array': {
		cast: function (value) {
			return value;
		},
		validate: function (value) {
			var result = {
				success: true,
				value: value
			};
			if (!_.isArray(value)) {
				result.success = false;
				result.error = 'VALIDATION_ERROR_NOT_ARRAY';

			}
			return result;
		}
	}
};
