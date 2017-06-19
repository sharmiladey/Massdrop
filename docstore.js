var mongoose = require('mongoose');
var request = require('request');
var util = require('util');

var DocumentSchema = mongoose.Schema({
    _id: String,
    html: String
});

var Document = mongoose.model('Document', DocumentSchema);

mongoose.connect('mongodb://localhost/urlstore');

var db = mongoose.connection;
mongoose.connection.on('error', function (err) {
    console.error('Error in MongoDB Connection.' + util.inspect(err));
    mongoose.disconnect();
});
mongoose.connection.on('disconnected', function () {
    console.info('MongoDB disconnected. Reconnecting ...');
    mongoose.connect('mongodb://localhost/urlstore');
});
mongoose.connection.on('connected', function() {
    console.info('Connected to MongoDB.');
});
mongoose.connection.on('open', function() {
    console.info('Connection to MongoDB is open.');
});
mongoose.connection.on('reconnected', function () {
    console.info('Reconnected to MongoDB.');
});

/**
 *
 * @param jobId -  jobId created during POST request
 * @param htmlContent
 * @param requestStatus - object which stores the jobIds of jobs which are being fetched
 */
var createDocument = function createDocument(jobId, htmlContent,requestStatus){

    //check if the document already exists in db
    //if it exists then log a message as it already exists
    //otherwise create the document in db
    Document.findOne({_id : jobId},function(err,body){
        if(err){
            console.error({
                "jobId": jobId,
                "Error" : err
            });
        } else if(body!== null){
            console.info({
                "jobId": jobId,
                "Message": "jobId "+jobId+" already exists in " +
                    "db so cannot recreate it due to duplicate key error."
            })
            delete requestStatus[jobId];
        } else {
            var doc = new Document();
            doc._id = jobId;
            doc.html = htmlContent;

            console.info("Storing document with jobId "+jobId+" in db");
            doc.save(function (err){
                if(err){
                    console.error({
                        "jobId": jobId,
                        "Error": err
                    });
                }
                delete requestStatus[jobId];
            })
        }

    })

}

/**
 *
 * @param url url sent in the POST request body
 * @param jobId jobId created during POST request
 * @param requestStatus object which stores the jobIds of jobs which are being fetched
 */
var getHtmlContent = function getHtmlContent(url,jobId,requestStatus){
    //get the html content from the url provided by the user

    requestStatus[jobId] = true;

    request(url, function(err, status, body) {
        if(err !== null || status.statusCode !== 200){
            console.error(" Error in getting the content from the url "+url+
            " provided.");
            delete requestStatus[jobId];
        } else {
            createDocument(jobId,body,requestStatus);
        }

    })
}

/**
 *
 * @param jobId
 * @param cb
 */
var getJobId = function getJobId(jobId,cb){

    Document.findOne({_id : jobId},function(err,body){
        return cb(err,body);
    })
}

module.exports.getHtmlContent = getHtmlContent;
module.exports.getJobId = getJobId;
