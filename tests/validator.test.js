'use strict';

var _ = require('lodash'),
	chai = require('chai');


var Validator = require('../lib/validator');

var assert = require('chai').assert;

chai.use(require('chai-shallow-deep-equal'));

describe('validator', function(){

	var schema,
		data;

	beforeEach(function(){
		schema = {
			mode: 'filter', // strict || loose || filter(default) for strict I should just get the keys on each iteration and throw error if it fails, no need to continue validation
			cast: false,	// if true will auto-cast to proper type
			properties: {
				// types: string, integer(int), number(float), boolean(bool), object
				name: {
					type: 'string',
					array: false
				},
				age: {
					type: 'integer',
					array: false
				},
				wins: {
					type: 'int',
					array: false
				},
				rating: {
					type: 'number'
				},
				money: {
					type: 'float',
					array: false
				},
				active: {
					type: 'boolean',
					array: false
				},
				skills: {
					type: 'string',
					array: true
				}
			}
		};
		data = {
			name: 'john',
			age: 24,
			wins: 12,
			rating: 4.3,
			money: 100.13,
			active: true,
			skills: [
				'dribble',
				'shoot'
			]
		}
	});


	it.only('should validate my data', function(){
		data = _.assign(data, {
			extra1: 'this should not be here',
			extra2: 'this should not be here'
		});
		var validator = new Validator(schema);
		validator.validate(data);
	});

	it('should throw an error with orphan data and strict mode', function(){
		schema.mode = 'strict';

		data = _.assign(data, {
			extra1: 'this should not be here'
		});
		var validator = new Validator(schema);
		var run = function(){
			validator.validate(data);
		};
		assert.throws(run, 'Properties not in schema are not allowed in strict mode:');

	});

	it('should keep orphan properties when in loose mode', function(){
		schema.mode = 'loose';
		var extraProperties = {
			extra1: 'this should not be here',
			extra2: 'this should not be here'
		};
		data = _.assign(data, extraProperties);
		var validator = new Validator(schema);
		var result = validator.validate(data);

		assert.shallowDeepEqual(result.data, extraProperties);

	});

});
