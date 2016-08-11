var express = require('express');

var app = express();

app.use(express.static(__dirname + ''));

var server = app.listen(process.env.PORT || 8080, function () {
    console.log('listening on PORT:',server.address().port,'...');
});
