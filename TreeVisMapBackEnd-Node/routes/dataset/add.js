let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://127.0.0.1:27017/";

module.exports = (req, res) => {
  res.setHeader('Content-Type', '')
  MongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true}, function(err, db) {
    if (err) {
      console.log(err)
      res.json({type: 'error', message: 'connection error'})
    }
    let GoTree = db.db("GoTree");
    let addedDataset = req.query
    GoTree.collection("dataset").insertOne(addedDataset, function(err) {
        if (err) {
          console.log(err)
          if (err.code === 11000) { 
            // 11000 means that duplicate error occurs
            res.json({type: 'error', message: 'The dataset name has already been used'})
          }
        } else { 
          res.json({type: 'success', message: 'upload dataset successfully'})
        }
        db.close();
    });
  });
};
