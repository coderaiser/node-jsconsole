#!/usr/bin/env node

'use strict';

const argv = process.argv;
const path = require('path');
const tryCatch = require('try-catch');
const vm = require('vm');

const DIR = __dirname + '/../';
const Index = path.join(DIR + 'html/index.html');

const Clients = [];
let Num = 0;

const argvLast    = argv.slice().pop();

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
    const webconsole = require('console-io/legacy');
    const http = require('http');
    
    const express = require('express');
    const app = express();
    const server = http.createServer(app);
    
    const port =    process.env.PORT            ||  /* c9           */
                    process.env.app_port        ||  /* nodester     */
                    process.env.VCAP_APP_PORT   ||  /* cloudfoundry */
                    1337;
    
    const ip =  process.env.IP ||  /* c9           */
                '0.0.0.0';
    
    webconsole.listen(null, {
        server: server,
        execute: execute,
        prompt: ' ',
        online: false,
    });
    
    app .use(webconsole({
            online: false,
        }))
        .use(express.static(DIR))
        
        .get('/', (req, res) => {
            res.sendFile(Index, (error) => {
                if (!error)
                    return;
                 
                 res
                    .status(error.status)
                    .end();
            });
        });
        
    server.listen(port, ip);
    
    console.log('url: http://' + ip + ':' + port);
}

function version() {
    const pack = require('../package.json');
    
    console.log('v' + pack.version);
}

function execute(socket, command) {
    const code = command.cmd;
    
    if (!Clients[Num])
        Clients[Num] = {
            context : vm.createContext()
        };
    
    const context = Clients[Num].context;
    
    const error = tryCatch(() => {
        vm.runInContext('result = eval("' + code + '")', context);
    });
    
    if (error)
        socket.emit('err', error.message + '\n');
    else
        socket.emit('data', context.result + '\n');
    
    socket.emit('prompt', '');
}

