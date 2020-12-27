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
    let password = req.query.password
    GoTree.collection("user-info").find({username: username}).toArray(function(err, result) {
      if (err) {
        console.log({type: 'error', message: 'some errors happpen. Please try again'})
      }
      if (result.length > 0) {
        let matchingObj = result[0]
        console.log('matchingObj.password', matchingObj.password, 'password', password)
        // length > 0 means the item with this username exists
        if ((+matchingObj.password) === (+password)) {
          // password can be matched means that the users info is right
          res.json({type: 'success', message: 'welcome! ' + username, userInfoObj: matchingObj})              
        } else {
          res.json({type: 'error', message: 'the password is wrong'})   
        }
      } else {
        // length < 0 means the item with this username does not exist
        res.json({type: 'error', message: 'the user name does not exist'})
      }
      db.close();
    });
  });
};
