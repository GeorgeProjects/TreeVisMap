const routes = require('express').Router();
const users = require('./user');
const template = require('./template')
const dataset = require('./dataset')
const api = require('./api')
const results = require('./results')

routes.get('/', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).json({ message: 'Connected!' });
});

routes.post("/",function(req,res){
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   res.status(200).json({ message: 'Connected!' });
});

routes.use('/user', users);
routes.use('/results', results);
routes.use('/template', template);
routes.use('/dataset', dataset);
routes.use('/api', api);

module.exports = routes;
