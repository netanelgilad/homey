"use strict";
const PORT = process.env.PORT || 35601;

/* Modules */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const uuid = require('uuid/v4');
const request = require('request');

/* Setup */
const commands = require('./commands');
const Broadlink = require('./device');
const { runCommand } = require('./runCommand');

function sendData(device = false, hexData = false) {
    if(device === false || hexData === false) {
        console.log('Missing params, sendData failed', typeof device, typeof hexData);
        return;
    }

    const hexDataBuffer = new Buffer(hexData, 'hex');
    device.sendData(hexDataBuffer);
}

/* Server */
let app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

async function sendCommand(device, data, times = 1) {
    for (let i = 0; i < times; i++) {
        sendData(device, data);

        await new Promise(res => setTimeout(res, 200));
    }
}

app.post('/command/:name', async function(req, res) {
    const command = commands.find((e) => { return e.command == req.params.name; });

    runCommand(command, req, res);
});

require('./tv-shows').tvShows(app);

app.listen(PORT);
console.log('Server running, go to http://localhost:' + PORT);
