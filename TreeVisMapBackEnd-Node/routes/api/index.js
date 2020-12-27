const api = require('express').Router();
const all = require('./all');
api.get('/', all);
module.exports = api;
