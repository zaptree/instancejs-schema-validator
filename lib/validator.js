'use strict';

var _ = require('lodash');

function Validator(schema){
	this.build(schema);
}

Validator.prototype.build = function(schema){
	this.schema = schema;
};

Validator.prototype.validate = function(_data){
	var data = JSON.parse(JSON.stringify(_data));

	var result = validate(data, this.schema, getOptions(this.schema));

	return {
		// originalData: _data,
		errors: _.isEmpty(result.errors) ? null : result.errors,
		data: result.data
	};
};

function validate(data, schema, options){
	var resultData = {};
	var errors = {};

	// todo: I should do the schema keys during build for small performance gain
	var dataKeys = _.keys(data);

	var orphans = _.filter(dataKeys, function(dataKey){
		return !schema.properties[dataKey];
	});

	if(orphans && options.mode === 'strict'){
		throw new Error('Properties not in schema are not allowed in strict mode: ' + orphans.join(', '));
	}

	_.each(schema.properties, function(property, key){
		var mergedOptions = _.({}, options, getOptions(property));

		if(property.array){
			// loop through array items and do the same thing you would do for a single item
		}else{
			// validate type
			// cast if cast is on

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

};

function getOptions(schema){
	return _.pick(schema, ['mode', 'cast']);
}

module.exports = Validator;
