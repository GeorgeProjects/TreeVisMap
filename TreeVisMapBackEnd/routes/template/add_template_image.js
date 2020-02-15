let MongoClient = require('mongodb').MongoClient;
let fs = require('fs-extra')
let url = "mongodb://127.0.0.1:27017/";

module.exports = (req, res) => {
  if (req.file == null) {

  } else {
    MongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true}, function(err, db) {
        var newImg = fs.readFileSync(filePath);
        // encode the file as a base64 string.
        var encImg = newImg.toString('base64');
        // define your new document
        var newItem = {
            description: req.body.description,
            contentType: req.file.mimetype,
            size: req.file.size,
            img: Buffer(encImg, 'base64')
        };
        let GoTree = db.db("GoTree");
        GoTree.collection('template')
           .insert(newItem, function(err, result) {
              if (err) { console.log(err); };
              var newoid = new ObjectId(result.ops[0]._id);
              fs.remove(req.file.path, function(err) {
                 if (err) { console.log(err) };
                 res.render('index', {title:'Thanks for the Picture!'});
              });
           });
        db.close();
    });
  }
};
