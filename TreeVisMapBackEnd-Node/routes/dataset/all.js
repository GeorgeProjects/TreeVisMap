let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://127.0.0.1:27017/";

module.exports = (req, res) => {
  MongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true}, function(err, db) {
    if (err) {
      console.log(err)
      res.json({type: 'error', log: 'Connection error'})
    }
    let GoTree = db.db("GoTree");
    GoTree.collection("dataset").find({}).toArray(function(err, result) {
      if (err) throw err;
      res.json(result)
      db.close();
    });
  });
};
