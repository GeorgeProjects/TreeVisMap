const dataset = require('express').Router();
const all = require('./all');
const query = require('./query');
const add = require('./add')
const remove = require('./remove')
dataset.get('/', all);
dataset.get('/query', query);
dataset.get('/add', add);
dataset.get('/remove', remove);
module.exports = dataset;
