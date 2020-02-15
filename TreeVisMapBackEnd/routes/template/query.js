let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://127.0.0.1:27017/";

module.exports = (req, res) => {
  MongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true}, function(err, db) {
    if (err) {
      console.log(err)
      res.json({type: 'error', message: 'connection error'})
    }
    let GoTree = db.db("GoTree");
    let username = req.query.username
    // GoTree.collection("template").find({$or:[{username: 'root'}, {username: username}]}).toArray(function(err, result) {
    GoTree.collection("template").find({username: username}).toArray(function(err, result) {
      if (err) {
        console.log({type: 'error', message: 'some errors happpen. Please try again'})
      }
      res.json(result)
      db.close();
    });
  });
};
