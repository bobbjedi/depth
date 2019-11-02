const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const log = require('./helpers/log');
const DIR_NAME = __dirname + '/public/';

require('./modules/api')(app);
require('./modules/cron');
require('./modules/checkerTx');
require('./modules/depth');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
// Sessions
// app.use(session({ resave: true, secret: '123456', saveUninitialized: true}));
const port = 36669;

app.use('/', express.static(DIR_NAME));
app.get('/', (req, res) => res.sendFile(DIR_NAME + 'index.html'));

app.listen(port, () => log.info('Server listening on port ' + port + ' http://localhost:' + port));
