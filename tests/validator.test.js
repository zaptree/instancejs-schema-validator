'use strict';

var _ = require('lodash'),
	chai = require('chai');


var Validator = require('../lib/validator');

var assert = require('chai').assert;

chai.use(require('chai-shallow-deep-equal'));

describe('validator', function () {

	var schema,
		data;

	beforeEach(function () {
		schema = {
			mode: 'filter', // strict || loose || filter(default) for strict I should just get the keys on each iteration and throw error if it fails, no need to continue validation
			cast: false,	// if true will auto-cast to proper type
			properties: {
				//this is the alterante array schema that would not limit you from having array of arrays
				//items: {
				//	type: 'array',
				//	schema: {
				//		type: 'array',
				//		schema: {
				//			type: 'string'
				//		}
				//	}
				//},
				// types: string, integer(int), number(float), boolean(bool), object
				name: {
					type: 'string'
				},
				age: {
					type: 'integer'
				},
				wins: {
					type: 'int'
				},
				rating: {
					type: 'number'
				},
				money: {
					type: 'float'
				},
				active: {
					type: 'boolean'
				},
				skills: {
					type: 'array',
					schema: {
						type: 'string'
					}
				},
				email: {
					type: 'string',
					validation: 'email',
					// default: 'proxy@schema-validator-js.com'
				},
				addresses: {
					type: 'array',
					schema: {
						type: 'object',
						properties: {
							street: {
								type: 'string'
							},
							zip: {
								type: 'integer'
							}
						}
					}

				},
				specials: {
					type: 'object',
					properties: {
						curve: {
							type: 'int'
						},
						nickname: {
							type: 'string'
						}
					}
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
			],
			addresses: [
				{
					street: 'twigs',
					zip: 33602
				}
			],
			specials: {
				curve: 3,
				nickname: 'snake'
			}
		}
	});

	// todo: I need to implement/test:
	// todo: casting
	// todo: type validation
	// todo: validation
	// todo: extending types
	// todo: extending validation
	// todo: arrays
	// todo: objects
	// todo: add mixed values

	it('should validate my data', function () {
		var validator = new Validator(schema);
		var result = validator.validate(data);
		assert(result.success);
		assert(!result.errors);
		assert.deepEqual(data, result.data);
	});


	it('should fail validation when passing in the wrong type', function () {
		data = {
			name: 123,
			wins: 'many',
			money: 'fifteen',
			active: 'hello',
			skills: 'shooting',
			specials: 'none'
		};
		var validator = new Validator(schema);
		var result = validator.validate(data);
		var errors = _.keys(result.errors);
		assert.deepEqual(errors, [
			'name',
			'wins',
			'money',
			'active',
			'skills',
			'specials'
		]);
		assert.deepEqual(result.data, data);
	});

	it('should fail validation for properties in an object', function () {
		data = {
			specials: {
				curve: 'wrong',
				nickname: 12
			}
		};
		var validator = new Validator(schema);
		var result = validator.validate(data);
		var errors = _.keys(result.errors);
		assert.deepEqual(errors, [
			'specials.curve',
			'specials.nickname'
		]);
		assert.deepEqual(result.data, data);
	});

	it('should fail validation for items in an array', function () {
		data = {
			skills: [
				1,
				'shooting',
				false
			]
		};
		var validator = new Validator(schema);
		var result = validator.validate(data);
		var errors = _.keys(result.errors);
		assert.deepEqual(errors, [
			'skills[0]',
			'skills[2]'
		]);
		assert.deepEqual(result.data, data);
	});

	it('should fail validation for properties in an object in an array', function () {
		data = {
			addresses: [
				{
					street: 12,
					zip: false
				}
			]
		};
		var validator = new Validator(schema);
		var result = validator.validate(data);
		var errors = _.keys(result.errors);
		assert.deepEqual(errors, [
			'addresses[0].street',
			'addresses[0].zip'
		]);
		assert.deepEqual(result.data, data);
	});

	it('should use the default value when value is missing', function () {
		schema.properties.email.default = 'test@email.com';
		schema.properties.skills.default = ['shooting'];
		var validator = new Validator(schema);
		var result = validator.validate({});
		assert.equal(result.data.email, schema.properties.email.default);
		assert.equal(result.data.skills, schema.properties.skills.default);
	});

	it('should throw an error with orphan data and strict mode', function () {
		schema.mode = 'strict';

		data = _.assign(data, {
			extra1: 'this should not be here'
		});
		var validator = new Validator(schema);
		var run = function () {
			validator.validate(data);
		};
		assert.throws(run, 'Properties not in schema are not allowed in strict mode:');

	});

	it('should keep orphan properties when in loose mode', function () {
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

	it('should filter out data that is not part of the schema when not using loose mode', function () {
		var extendedData = _.assign({}, data, {
			extra1: 'this should not be here',
			extra2: 'this should not be here'
		});
		var validator = new Validator(schema);
		var result = validator.validate(extendedData);
		assert.deepEqual(result.data, data);
	});

	describe('validation', function(){
		it.only('should compile validation rules when creating a schema', function(){
			schema = {
				properties: {
					email: {
						type: 'string',
						validation: 'email'
					},
					phone: {
						type: 'string',
						validation: 'phoneUS|required[email="no"]|equals[phone2]'
					},
					combined: {
						type: 'string',
						validation: 'combined[param=hello,param2=,world]'
					}
				}
			};
			var expected = {
				properties: {
					email: {
						type: 'string',
						validation: [
							{
								type: 'email',
								arguments: []
							}
						]
					},
					phone: {
						type: 'string',
						validation: [
							{
								type: 'phoneUS',
								arguments: []
							},
							{
								type: 'required',
								arguments: [
									{
										key: 'email',
										value: 'no'
									}
								]
							},
							{
								type: 'equals',
								arguments: [
									'phone2'
								]
							},
						]
					},
					combined: {
						type: 'string',
						validation: [
							{
								type: 'combined',
								arguments: [
									{
										key: 'param',
										value: 'hello'
									},
									{
										key: 'param2',
										value: ''
									},
									'world'
								]
							}
						]
					}
				}
			};
			var validator = new Validator(schema);
			assert.deepEqual(validator.schema, expected);
		});

		it('should validate email fields', function(){
			schema = {
				properties: {
					email: {
						type: 'string',
						validation: 'email'
					},
					emailBad: {
						type: 'string',
						validation: 'email'
					}
				}
			};
			data = {
				email: 'nick@schema-validator.com',
				emailBad: 'nick@'
			};
			var validator = new Validator(schema);
			var result = validator.validate(data);

			assert.isFalse(result.success, 'it should fail success');
			assert.isObject(result.errors, 'it should have errors');
			assert(!result.errors.email, 'email should validate email');
			assert(result.errors.emailBad, 'email should fail to validate emailBad');
		});
	});

});
