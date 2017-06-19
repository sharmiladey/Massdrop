var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);


// all environments

app.use(express.json());
app.use(express.urlencoded());


//declare all the routes for all the logic to
//to applied for this app
require('./routes/post_and_get.js')(app);

server.listen(process.env.PORT || 5000);
console.log('Listening at 127.0.0.1:' + 5000);