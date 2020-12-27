let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://127.0.0.1:27017/";

module.exports = (req, res) => {
    let userInfoObj = {
      username: req.query.username,
      password: req.query.password,
      email: req.query.email
    }
    console.log('userInfoObj', userInfoObj)
    MongoClient.connect(url,  {useUnifiedTopology: true, useNewUrlParser: true}, function(err, db) {
      if (err) {
        console.log(err)
        res.json({type: 'error', message: 'connection error'})
      }
      var GoTree = db.db("GoTree");
      GoTree.collection("user-info").insertOne(userInfoObj, function(err) {
        if (err) {
          console.log(err)
          if (err.code === 11000) { 
            // 11000 means that duplicate error occurs
            res.json({type: 'error', message: 'The user name has already been used'})
          }
        } else { 
          res.json({type: 'success', message: 'register successfully', userInfoObj: userInfoObj})
        }
        db.close();
      });
    })
};