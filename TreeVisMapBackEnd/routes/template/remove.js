let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://127.0.0.1:27017/";

module.exports = (req, res) => {
  MongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true}, function(err, db) {
    if (err) {
      console.log(err)
      res.json({type: 'error', message: 'connection error'})
    }
    let GoTree = db.db("GoTree");
    let removeTemplate = req.query
    console.log('removeTemplate', removeTemplate)
    GoTree.collection("template").deleteOne(removeTemplate, function(err) {
        if (err) {
          console.log(err)
        } else { 
          res.json({type: 'success', message: 'remove template successfully'})
        }
        db.close();
    });
  });
};
