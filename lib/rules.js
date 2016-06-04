'use strict';

module.exports = {
	email: {
		validate: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
		message: 'VALIDATION_FAILED_EMAIL'
	},
	betweenNumber: {
		validate: function(value, options, _from, _to){
			var from = Number(_from),
				to = Number(_to);
			return value >= from && value <= to;
		},
		message: 'VALIDATION_FAILED_BETWEEN_NUMBER'
	},
	// this require is for conditional required not the default required in the schema
};
