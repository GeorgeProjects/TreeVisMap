const users = require('express').Router();
const all = require('./all');
const signin = require('./signin');
const signup = require('./signup');
users.get('/', all);
users.get('/signin', signin);
users.get('/signup', signup);
module.exports = users;
