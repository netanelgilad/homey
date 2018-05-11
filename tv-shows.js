const WEbTorrent = require('webtorrent');
const networkAddress = require('network-address');
const Chromecast = require('chromecasts');
const {search} = require("thepiratebay");
const { get } = require('axios');
const { runCommand } = require('./runCommand');

const pad = (number) => number < 10 ? `0${number}` : String(number);

const safeGet = async url => {
    try {
        const response = await get(url);
        return response.data;
    }
    catch (err) {
        console.log('Failed to get from url', url);
        console.log(err);
        console.log(err.response.data);
    }
}

exports.tvShows = function(app) {
    app.post('/tv-show', async (req, res) => {
        let tvShow = req.body.tvShow;
        console.log("Got request to stream the last episode of", tvShow);

        if (tvShow.startsWith("of ")) {
            tvShow = tvShow.replace("of ", "");
        }

        tvShow = tvShow.replace("'", "");
        tvShow = tvShow.replace(/ \w /, " ");

        const showInfo = await safeGet(`http://api.tvmaze.com/singlesearch/shows?q=${tvShow}`);
        const lastEpisodeInfo = await safeGet(showInfo._links.previousepisode.href);
        const season = lastEpisodeInfo.season;
        const episode = lastEpisodeInfo.number;
        console.log(`Downloading torrent for season ${season} and episode ${episode}`);

        const results = await search(`${tvShow} s${pad(season)}e${pad(episode)}`);

        console.log(`Got ${results.length} results from thepiratebay.`);
        if (results.length === 0) {
            console.log("Oops, not matching results found");
            res.sendStatus(500);
            res.end();
            return;
        }

        const bestTorrent = results[0];
        const magnetLink = bestTorrent.magnetLink;

        const client = new WEbTorrent({});
        client.on('error', console.log);

        const torrent = client.add(magnetLink, {path: process.cwd()});
        torrent.on('infoHash', () => {
            console.log("Got torrent infoHas, creating server...");
            const server = torrent.createServer();
            server.listen(0, () => {
                console.log("server started on ", server.address());
                if (torrent.ready) onReady(torrent, server.address().port, req, res)
                else torrent.once('ready', () => onReady(torrent, server.address().port), req, res)
            }).on('error', function (err) {
                if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
                  // If port is taken, pick one a free one automatically
                  return server.listen(0, initServer)
                }
                console.log(err);
              });
        });
    });
}

function onReady(torrent, port, req, res) {
    console.log("server and torrent are ready, streaming to chromecast...");
    var index = torrent.files.indexOf(torrent.files.reduce(function (a, b) {
      return a.length > b.length ? a : b
    }));
    
    const href = 'http://' + networkAddress() + ':' + port + '/' + index;
    
    const chromecastClient = Chromecast();
    let foundChromecast = false;
    chromecastClient.on('update', player => {
        if (player.name.toLowerCase() === "living room tv" && !foundChromecast) {
            console.log("found chromecast, changing source and streaming...");
            foundChromecast = true;

            console.log("Changing to chromecast");
            const command = commands.find((e) => { return e.command == "change_to_Chromecast"; });
            runCommand(command, req, res);

            player.play(href, {
                title: 'Homey - ' + torrent.files[index].name
              });
            player.on('error', err => {
                err.message = 'Chromecast: ' + err.message
                console.log(err);
            })
        }
    })
}