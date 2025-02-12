'use strict';

const { userValidators } = require('./definition/allValidators');
const validationResultCheck = require('./definition/validationResultCheck');

const signupValidators = [
    userValidators.email,
    userValidators.password('password'),
    userValidators.checkSamePassword('password', 'passwordConfirmation')
].concat(validationResultCheck);

module.exports = {
    signupValidators
};
