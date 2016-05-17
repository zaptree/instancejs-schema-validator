var old = {
	validate: function (data, action, schema, strictSchema, path, parent) {
		schema = schema || {};
		data.$$parent = parent;
		path = path || [];
		var _this = this;
		var result = {
			success: true,
			validation: {},
			data: {}
		};

		_.each(data, function (val, key) {
			if (key === '$$parent') {
				return;
			}
			var itemSchema = schema[key];
			if (itemSchema) {
				var type = itemSchema.type || 'string';
				var valid = _this.valid(val, {
					type: type,
					validation: itemSchema.validation,
					array: itemSchema.array,
					data: data
				});
				if (valid.success) {
					val = valid.value;
					if (itemSchema.array) {

						result.data[key] = [];
						_.each(val, function (arrayItem, i) {

							if (type === 'object') {
								//for arrays we wan't to pass the actual array as a parent, since we can't add properties to an array we pass in an object with the array as a value
								var subResult = _this.validate(arrayItem, action, itemSchema.schema, strictSchema, path.concat(key, i), {
									value: val,
									$$parent: data
								});
								if (subResult.success) {
									result.data[key].push(subResult.data);
								} else {
									result.success = false;
									_.extend(result.validation, subResult.validation);
								}
							} else {
								//if the itme is not an object we do standard validation instead of calling the method recursively
								var valid = _this.valid(arrayItem, {
									type: type,
									validation: itemSchema.validation,
									data: data
								});
								if (valid.success) {
									result.data[key].push(valid.value);
								} else {
									result.validation[(path.concat(key, i)).join('.')] = valid;
									result.success = false;
								}
							}

						});
					} else if (type === 'object') {
						var subResult = _this.validate(val, action, itemSchema.schema, strictSchema, path.concat(key), data);
						if (subResult.success) {
							result.data[key] = subResult.data;
						} else {
							result.success = false;
							_.extend(result.validation, subResult.validation);
						}
					} else {
						result.data[key] = val;
					}
					//check if it is an array, or object and then validate that before
				} else {
					result.validation[(path.concat(key)).join('.')] = valid;
					result.success = false;
				}
			} else if (!strictSchema) {
				result.data[key] = val;
			}
		});

		return result;
	},

	valid: function (val, options) {
		//options.array = boolean
		//types: string,object,array,number,boolean
		var type = options.type.toLowerCase();
		var success = true;
		var message = '';
		if (options.array === true) {
			if (!_.isArray(val)) {
				success = false;
				message = 'Value must be an array';

			}

		} else if (type === 'object') {

			if (!_.isObject(val)) {
				success = false;
				message = 'Value must be an object';

			}
		} else if (type === 'objectid' && _.isString(val)) {
			val = new mongodb.ObjectID(val);
		} else {
			if (type === 'string') {
				if (!_.isString(val)) {
					success = false;
					message = 'Value must be a string';
				}
			} else if (type === 'number') {
				if (!_.isNumber(val)) {
					success = false;
					message = 'Value must be a number';
				}
			} else if (type === 'boolean') {
				if (!_.isBoolean(val)) {
					success = false;
					message = 'Value must be a number';
				}
			}

			if (success) {
				//validate the value using validator
			}
		}


		var result = {
			success: success,
			message: message
		};
		//we don't want to bloat the errors returned so we don't add the value since we only need it in case it was transformed for valid data (i.e. ObjectId)
		success && (result.value=val);
		return result;
	}
}