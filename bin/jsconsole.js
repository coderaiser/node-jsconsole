#!/usr/bin/env node

'use strict';

var argv        = process.argv,
    path        = require('path'),
    tryCatch    = require('try-catch'),
    vm          = require('vm'),
    
    DIR         = __dirname + '/../',
    Index       = path.join(DIR + 'html/index.html'),
    
    Clients     = [],
    Num         = 0,
    
    argvLast    = argv.slice().pop();

switch (argvLast) {
case '-v':
    version();
    break;

case '--v':
    version();
    break;

default:
    start();
}

function start() {
    var webconsole  = require('console-io/legacy'),
        http        = require('http'),
        
        express     = require('express'),
        mollify     = require('mollify'),
        
        app         = express(),
        server      = http.createServer(app),
        
        port        =   process.env.PORT            ||  /* c9           */
                        process.env.app_port        ||  /* nodester     */
                        process.env.VCAP_APP_PORT   ||  /* cloudfoundry */
                        1337,
        
        ip          =   process.env.IP              ||  /* c9           */
                        '0.0.0.0';
    
    webconsole.listen(null, {
        server: server,
        execute: execute,
        prompt: ' ',
        online: false,
        minify: false
    });
    
    app .use(webconsole({
            online: false,
            minify: false
        }))
        .use(mollify({
            dir: DIR
        }))
        .use(express.static(DIR))
        
        .get('/', function (req, res) {
            res.sendFile(Index, function(error) {
                if (error)
                     res
                        .status(error.status)
                        .end();
            });
        });
        
    server.listen(port, ip);
    
    console.log('url: http://' + ip + ':' + port);
}

function version() {
    var pack = require('../package.json');
    
    console.log('v' + pack.version);
}

function execute(socket, code) {
    var error, context;
    
    if (!Clients[Num])
        Clients[Num] = {
            context : vm.createContext()
        };
    
    context = Clients[Num].context;
    
    error   = tryCatch(function() {
        vm.runInContext('result = eval("' + code + '")', context);
    });
    
    if (error)
        socket.emit('err', error.message + '\n');
    else
        socket.emit('data', context.result + '\n');
    
    socket.emit('prompt', '');
}

