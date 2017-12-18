"use strict";
const PORT = process.env.PORT || 1880;

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
    try {
    const command = commands.find((e) => { return e.command == req.params.name; });

    if (command && req.body.secret && req.body.secret == command.secret) {
        let host = command.mac || command.ip;
        let device = Broadlink({ host });

        if (!device) {
            console.log(`${req.params.name} sendData(no device found at ${host})`);
        } else if (!device.sendData) {
            console.log(`[ERROR] The device at ${device.host.address} (${device.host.macAddress}) doesn't support the sending of IR or RF codes.`);
        } else if (command.data && command.data.includes('5aa5aa555')) {
            console.log('[ERROR] This type of hex code (5aa5aa555...) is no longer valid. Use the included "Learn Code" accessory to find new (decrypted) codes.');
        } else {
            if('sequence' in command) {
                console.log('Sending sequence..');
                for(var i in command.sequence) {
                    let find = command.sequence[i];
                    let send = commands.find((e) => { return e.command == find; });
                    if(send) {
                        console.log(`${new Date()} Sending command ${send.command}`)
                        await sendCommand(device, send.data, req.body.times);
                        await new Promise(res => setTimeout(res, 1000));
                    } else {
                        console.log(`Sequence command ${find} not found`);
                    }
                }
            } else {
                sendCommand(device, command.data, req.body.times);
            }

            return res.sendStatus(200);
        }

        res.sendStatus(501);
    } else {
        console.log(`Command not found: ${req.params.name}`);
        res.sendStatus(400);
    }
    }
    catch (err) {
        console.error(err);
        res.send(500);
    }
});

app.listen(PORT);
console.log('Server running, go to http://localhost:' + PORT);
