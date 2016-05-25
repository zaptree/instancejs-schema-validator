'use strict';

var _ = require('lodash');

module.exports = {
	// todo: I can add an objectId type that automatically converts the string to an actual objectId
	'bool': 'boolean',
	'boolean': {
		cast: function (value) {
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
		cast: function (value) {
			return value;
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
		cast: function (value) {
			return value;
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
