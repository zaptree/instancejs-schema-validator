'use strict';

var _ = require('lodash');

function Validation(){

}
// todo: I should not care about require that will get taken care of in the validator side
_.assign(Validation.prototype, {
	validate: function(){
		return {
			success: true
		};
	}
});

module.exports = Validation;