// Load module dependencies
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
var morgan = require('morgan');
var winston = require('./config/winston');
const routes = require('./app/routes/index.route');

// Init app
const app = express();

// BodyParser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set it to stream interface and winston configuration
app.use(morgan('combined', { stream: winston.stream }));


// Routes
app.use('/', routes);

app.get('*', (req, res) => {
    res.send("Invalid page");
});


// error handler

app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // add this line to include winston logging
    winston.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

const port = process.env.PORT || '3000';

// Set port
app.set('port', port);

const server = http.createServer(app);
server.listen(port, () => console.log(`API running on localhost:${port}`));

// Exposing an app
module.exports = app;