const Broadlink = require('./device');
const commands = require('./commands');

async function sendCommand(device, data, times = 1) {
    for (let i = 0; i < times; i++) {
        sendData(device, data);

        await new Promise(res => setTimeout(res, 200));
    }
}

function sendData(device = false, hexData = false) {
    if(device === false || hexData === false) {
        console.log('Missing params, sendData failed', typeof device, typeof hexData);
        return;
    }

    const hexDataBuffer = new Buffer(hexData, 'hex');
    device.sendData(hexDataBuffer);
}

exports.runCommand = async function(command, req, res) {
    try {
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
                console.log(`Sending command ${command.name}...`);
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
}