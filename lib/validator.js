'use strict';

var _ = require('lodash');

function Validator(schema){
	this.schema = schema;
}

Validator.prototype.validate = function(_data){
	var data = JSON.parse(JSON.stringify(_data));
	return {
		originalData: _data,
		errors: null,
		data: data
	};
};

module.exports = Validator;
