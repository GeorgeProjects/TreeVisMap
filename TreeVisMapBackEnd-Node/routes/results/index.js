const results = require('express').Router();
const save = require('./save');
results.post('/save', save);
module.exports = results;


