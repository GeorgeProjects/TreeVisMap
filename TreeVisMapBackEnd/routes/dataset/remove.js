let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://127.0.0.1:27017/";

module.exports = (req, res) => {
  MongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true}, function(err, db) {
    if (err) {
      console.log(err)
      res.json({type: 'error', message: 'connection error'})
    }
    let GoTree = db.db("GoTree");
    let removeDataset = req.query
    console.log('removeDataset', removeDataset)
    GoTree.collection("dataset").deleteOne(removeDataset, function(err) {
        if (err) {
          console.log(err)
        } else { 
          res.json({type: 'success', message: 'remove dataset successfully'})
        }
        db.close();
    });
  });
};
