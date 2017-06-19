var async = require('async');
var MAX_WORKER = 5;  //maximum concurrent workers
var crypto = require('crypto');
var queue = async.queue(postAndGet, MAX_WORKER);
var ds = require('../docstore.js');

// Status Codes
var STATUS_OK = 200;
var SERVER_ERROR = 500;
var NOT_FOUND = 404;
var BAD_REQUEST = 400;

var requestStatus = {};

/**
 *
 * @param app
 */
module.exports = function apiHandler(app){

    app.post('/create',function post_dispatcher(req, res){
        var url = req.body.url;
        if(url == undefined || url == null){
            res.status(BAD_REQUEST).json({"Error": "JSON passed is incorrect due" +
                " to invalid url parameter"});
        }

        //Generating an unique id for the url sent by the user
        var id = crypto.createHash('md5').update(url).digest('hex');
//        m.update(url);
//        var id = m.digest('hex');

        if(requestStatus[id]){
            res.status(STATUS_OK).json({"Info": "Currently retrieving the same url" +
                " for other request"});
        } else {
            console.info("Queueing the create request");
            queue.push({
                taskType:'createJob',
                jobId: id,
                reqBody: req.body,
                response: res
            })
        }
        res.status(STATUS_OK).json({"jobId": id});
    })

    app.get('/job/:jobId', function get_dispatcher(req, res){
        if(req.params.jobId === undefined){
            res.status(BAD_REQUEST).json({"Error": "Incorrect JobId as it is undefined"});
        }
        console.info("Queueing the get request");
        queue.push({
            taskType:'getJob',
            jobId: req.params.jobId,
            response:res
        })
    })

    app.get('/status/:jobId', function get_dispatcher(req, res){
        if(requestStatus[req.params.jobId]){
            res.status(STATUS_OK).json({"Info":"Still retrieving the url"});
        } else {
            console.info("Queueing the get status request");
            queue.push({
                taskType:'getJob',
                jobId: req.params.jobId,
                response:res
            })
        }

    })
}


/**
 *
 * @param task-task type (post or get)
 * @param cb- callback
 */
function postAndGet(task, cb){
    switch (task.taskType) {
        case 'createJob':
            //create job and store it in db
            console.info("Storing the content for the url sent by user " +
                "in db");
            ds.getHtmlContent(task.reqBody.url,task.jobId,requestStatus);
            break;

        case 'getJob':
            //get the content for a  specific jobId
            console.info("Getting the content for the jobId "+task.jobId+"" +
                " sent by the user");
            ds.getJobId(task.jobId,function(err,body){
                if(err){
                    task.response.status(SERVER_ERROR).json({
                        "Database Error": err
                    });
                } else if(body === null){
                    task.response.status(NOT_FOUND).json({"Error" : "Invalid Id as Id does not exist"});
                } else {
                    task.response.status(STATUS_OK).json({
                        "jobId" : task.jobId,
                        "content":body.html
                    })
                }
            })

        default:
            //Do nothing and return from callback
            cb(null);

    }

}


