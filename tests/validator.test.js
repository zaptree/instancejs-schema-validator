'use strict';

var Validator = require('../lib/validator');

describe('validator', function(){

	it('should validate my data', function(){
		var schema = {

		};
		var data = {

		};
		var validator = new Validator(schema);
		validator.validate(data);
	});

});
