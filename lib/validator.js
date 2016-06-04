'use strict';

var _ = require('lodash');

var Validation = require('./validation');

var defaultTypes = require('./types');

function Validator(schema, options) {
	this.options = _.assign({
		langFile: './lang/en-us'
	}, options);

	var lexicon = require(this.options.langFile);
	if(this.options.lexicon){
		lexicon = _.assign({}, lexicon, this.options.lexicon);
	}
	this.lexicon = lexicon;

	var types = defaultTypes;
	if(this.options.types){
		types = _.assign({}, types, this.options.types);
	}
	this.types = types;

	this.build(schema);
	this.validation = new Validation({
		lexicon: this.lexicon,
		rules: this.options.rules			// todo: add ability to pass in custom rules
	});
}

_.assign(Validator.prototype, {
	build: function (schema) {
		var builtSchema = JSON.parse(JSON.stringify(schema));

		var convertValidation = function(validation){
			var split = validation.split('|');
			return _.map(split, function(stringRule){
				var argsMatch = stringRule.match(/([^\[]+)(\[(.*)\])?$/);
				var rule = {
					type: argsMatch[1],
					arguments: []
				};
				if(argsMatch[3]){
					var args = argsMatch[3].split(',');
					rule.arguments = _.map(args, function(arg){
						var argMatch = arg.match(/([^=]+)(=(.*))?/);
						if(_.isUndefined(argMatch[2])){
							return arg;
						}
						return {
							key: argMatch[1],
							value: argMatch[3].replace(/^"(.+)"$/, '$1')
						};
					});
				}
				return rule;
			});
		};
		var buildProperty = function(prop){
			if(prop.validation){
				prop.validation = convertValidation(prop.validation);
			}
			if(prop.properties){
				buildProperties(prop.properties);
			}else if(prop.schema){
				buildProperty(prop.schema);
			}
		};
		var buildProperties = function(props){
			_.each(props, buildProperty);
		};
		buildProperties(builtSchema.properties);

		this.schema = builtSchema;
	},
	validate: function (_data) {
		var data = _.cloneDeep(_data);

		var result = this._validate(data, this.schema, this.getOptions(this.schema));

		var errors = _.isEmpty(result.errors) ? null : result.errors;
		return {
			// originalData: _data,
			success: !errors,
			errors: errors,
			data: result.data
		};
	},
	_validate: function (data, schema, options, _fullKey, parent) {
		var _this = this;
		var resultData = {};
		var errors = {};

		if(!schema.properties){
			throw new Error('Shema has no properties');
		}

		if(parent && data){
			// if the parent[''] exists it means the parant was an array so we want the actual value of parent.$$parent
			data.$$parent = parent[''] && parent.$$parent ? parent.$$parent : parent;
		}

		// todo: I should do the schema keys during build for small performance gain
		var dataKeys = _.keys(data);

		var orphans = _.filter(dataKeys, function (dataKey) {
			return !schema.properties[dataKey] && ['$$parent', '$$siblings'].indexOf(dataKey) === -1;
		});

		if (orphans && options.mode === 'strict') {
			throw new Error('Properties not in schema are not allowed in strict mode: ' + orphans.join(', '));
		}

		_.each(schema.properties, function (property, key) {
			var mergedOptions = _.assign({}, options, _this.getOptions(property));
			var value = data[key];
			var hasProperty = data.hasOwnProperty(key);
			// if key==='' it means we don't want to add the . (it's from a recursive array call)
			var propertyFullKey = key ? ((_fullKey ? _fullKey + '.' : '') + key) : _fullKey;
			var validated = _this.valid(value, data, property, mergedOptions);


			// so there is a limitation that I can't have array of arrays with how i've done this
			if (property.type === 'array') {

				// todo: make array code use recursive call making data = {'0':value} i.e passing an object with a single key
				if (hasProperty && validated.success) {
					if(property.schema){
						var resultArray = [];
						_.each(validated.value, function (item, i) {
							var itemPropertyFullKey = propertyFullKey + '[' + i + ']';
							var itemKey = '';
							var itemData = {
								$$index: i,
								$$siblings: validated.value
							};
							var itemSchema = {
								properties: {}
							};
							itemData[itemKey] = item;
							itemSchema.properties[itemKey] = property.schema;

							var validatedItem = _this._validate(itemData, itemSchema, mergedOptions, '', data);
							_.each(validatedItem.errors, function (error, key) {
								errors[itemPropertyFullKey + (key ? '.' + key : '')] = error;
							});
							resultArray.push(validatedItem.data[itemKey]);

						});
						resultData[key] = resultArray;
					}else{
						resultData[key] = validated.value;
					}


				} else if (hasProperty || validated.value) {
					resultData[key] = validated.value;
				}

			} else if (property.type === 'object') {
				if (validated.success && validated.value) {
					// if there is no properties in the property it means it's just a free form object
					if(property.properties){
						var validatedObject = _this._validate(validated.value, property, mergedOptions, propertyFullKey, data);
						_.assign(errors, validatedObject.errors);
						resultData[key] = validatedObject.data;
					}else{
						resultData[key] = validated.value;
					}

				} else if (hasProperty) {
					resultData[key] = validated.value;
				}
			} else {
				// value could be a 0, null or a falsy value so we check hasProperty, it could also have a default value
				// even it hasProperty is false so we check validated.value
				if (hasProperty || validated.value) {
					resultData[key] = validated.value;
				}
			}

			if (!validated.success) {
				errors[propertyFullKey] = validated.error;
			}

		});

		if (orphans && options.mode === 'loose') {
			_.each(orphans, function (key) {
				resultData[key] = data[key];
			});
		}

		return {
			data: resultData,
			errors: errors
		};

	},
	// fixme: I need to pass in $$parent and the whole data object basically for comparative rules
	valid: function (val, data, property, options) {
		var result = {
			success: true,
			error: null,
			value: val
		};

		if (_.isUndefined(val)) {
			if (property.required) {
				result.success = false;
				result.error = this.getErrorMessage('VALIDATION_ERROR_REQUIRED');
				return result;
			} else if (property.default) {
				result.success = true;
				result.value = property.default;
				return result;
			} else {
				return result;
			}
		}

		var value = val;
		// first we do casting (if enabled) and then type checking
		var type = this.types[property.type];
		// if type is a string it means it was an alias, get the actual type using alias
		if (_.isString(type)) {
			type = this.types[type];
		}
		if (options.cast) {
			value = type.cast(value);
			result.value = value;
		}
		var typeValidateResult = type.validate(value);
		_.assign(result, typeValidateResult);

		// if type checking was succesful then we do the validation
		if (result.success) {
			var validationResult = this.validation.validate(value, data, property, options);
			_.assign(result, validationResult);
		}else{
			result.error = this.getErrorMessage(result.error);
		}

		return result;

	},
	getErrorMessage: function(key){
		return {
			id: key,
			value: this.lexicon[key] || key
		};
	},
	getOptions: function (schema) {
		return _.pick(schema, ['mode', 'cast']);
	}

});


module.exports = Validator;
