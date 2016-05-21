'use strict';

var _ = require('lodash');

var Validation = require('./validation');


var defaultTypes = {
	// todo: I can add an objectId type that automatically converts the string to an actual objectId
	'bool': 'boolean',
	'boolean': {
		cast: function(value){
			return value;
		},
		validate: function(value){
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
		cast: function(value){
			return value;
		},
		validate: function(value){
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
		cast: function(value){
			return value;
		},
		validate: function(value){
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
		cast: function(value){
			return value;
		},
		validate: function(value){
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
		cast: function(value){
			return value;
		},
		validate: function(value){
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
	}
};

var validationRules = {
	between: {},
	// this require is for conditional required not the default required in the schema
};

function Validator(schema){
	this.types = defaultTypes;
	this.build(schema);
	this.validation = new Validation();
}

_.assign(Validator.prototype, {
	build: function(schema){
		this.schema = schema;
	},
	validate: function(_data){
		var data = JSON.parse(JSON.stringify(_data));

		var result = this._validate(data, this.schema, this.getOptions(this.schema));

		var errors = _.isEmpty(result.errors) ? null : result.errors;
		return {
			// originalData: _data,
			success: !errors,
			errors: errors,
			data: result.data
		};
	},
	_validate: function(data, schema, options, _fullKey){
		var _this = this;
		var resultData = {};
		var errors = {};
		var fullKey = _fullKey ? _fullKey + '.' : '';

		// todo: I should do the schema keys during build for small performance gain
		var dataKeys = _.keys(data);

		var orphans = _.filter(dataKeys, function(dataKey){
			return !schema.properties[dataKey];
		});

		if(orphans && options.mode === 'strict'){
			throw new Error('Properties not in schema are not allowed in strict mode: ' + orphans.join(', '));
		}

		_.each(schema.properties, function(property, key){
			var mergedOptions = _.assign({}, options, _this.getOptions(property));
			var value = data[key];
			var hasProperty = data.hasOwnProperty(key);
			var propertyFullKey = fullKey + key;
			var validated = _this.valid(value, data, property, mergedOptions);

			// todo: make array code use recursive call making data = {'0':value} i.e passing an object with a single key
			// so there is a limitation that I can't have array of arrays with how i've done this
			if(property.array) {
				if (hasProperty && validated.success) {
					var resultArray = [];
					_.each(validated.value, function (item, i) {
						var itemPropertyFullKey = propertyFullKey + '[' + i + ']';
						var validatedItem = _this.valid(item, data, property, mergedOptions, true);

						if(property.type==='object' && validatedItem.success){
							var validatedObject = _this._validate(validatedItem.value, property, mergedOptions, itemPropertyFullKey);
							_.assign(errors, validatedObject.errors);
							resultArray.push(validatedObject.data);
						}else{
							resultArray.push(validatedItem.value);
						}

						if (!validatedItem.success) {
							errors[itemPropertyFullKey] = validatedItem.error;
						}

					});
					// loop through array items and do the same thing you would do for a single item
					resultData[key] = resultArray;

				} else if (hasProperty || validated.value) {
					resultData[key] = validated.value;
				}
			}else if(property.type==='object'){
				if(validated.success && validated.value){
					var validatedObject = _this._validate(validated.value, property, mergedOptions, propertyFullKey);
					_.assign(errors, validatedObject.errors);
					resultData[key] = validatedObject.data;
				}else if(hasProperty){
					resultData[key] = validated.value;
				}
			}else{
				// value could be a 0, null or a falsy value so we check hasProperty, it could also have a default value
				// even it hasProperty is false so we check validated.value
				if(hasProperty || validated.value){
					resultData[key] = validated.value;
				}
			}

			if(!validated.success){
				errors[propertyFullKey] = validated.error || 'VALIDATION_ERROR_MISSING';
			}

		});

		if(orphans && options.mode === 'loose'){
			_.each(orphans, function(key){
				resultData[key] = data[key];
			});
		}

		return {
			data: resultData,
			errors: errors
		};

	},
	// fixme: I need to pass in $$parent and the whole data object basically for comparative rules
	valid: function (val, data, property, options, notArray){
		var result = {
			success: true,
			error: null,
			value: val
		};

		if(_.isUndefined(val)){
			if(property.required){
				result.success = false;
				result.error = 'VALIDATION_ERROR_REQUIRED';
				return result;
			}else if(property.default) {
				result.success = true;
				result.value = property.default;
				return result;
			}else{
				return result;
			}
		}

		// the not array is passed in when validating the items in the actual array
		if(property.array && !notArray){
			if (!_.isArray(val)) {
				result.success = false;
				result.error = 'VALIDATION_ERROR_NOT_ARRAY';

			}
		}else{
			var value = val;
			// first we do casting (if enabled) and then type checking
			var type = this.types[property.type];
			// if type is a string it means it was an alias, get the actual type using alias
			if(_.isString(type)){
				type = this.types[type];
			}
			if(options.cast){
				value = type.cast(value);
			}
			var typeValidateResult = type.validate(value);
			_.assign(result, typeValidateResult);

			// if type checking was succesful then we do the validation
			if(result.success){
				var validationResult = this.validation.validate(value, data, property, options);
				_.assign(result, validationResult);
			}
			// I should have an object of types with a validate and cast methods for each one, that way it's easier to extend
		}

		return result;

	},
	getOptions: function (schema){
		return _.pick(schema, ['mode', 'cast']);
	}

});


module.exports = Validator;
