const WEbTorrent = require('webtorrent');
const networkAddress = require('network-address');
const Chromecast = require('chromecasts');
const {search} = require("thepiratebay");
const { get } = require('axios');

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

        const showInfo = await safeGet(`http://api.tvmaze.com/singlesearch/shows?q=${tvShow}`);
        const lastEpisodeInfo = safeGet(showInfo._links.previousepisode.href);
        const season = lastEpisodeInfo.season;
        const episode = lastEpisodeInfo.number;
        console.log(`Downloading torrent for season ${season} and episode ${episode}`);

        const results = await search(`${tvShow} s${pad(season)}e${pad(episode)}`);

        const bestTorrent = results[0];
        const magnetLink = bestTorrent.magnetLink;

        const client = new WEbTorrent({});
        client.on('error', console.log);

        const torrent = client.add(magnetLink, {path: process.cwd()});
        torrent.on('infoHash', () => {
            const server = torrent.createServer();
            server.listen(0, () => {
                if (torrent.ready) onReady(torrent, server.address().port)
                else torrent.once('ready', () => onReady(torrent, server.address().port))
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

function onReady(torrent, port) {
    var index = torrent.files.indexOf(torrent.files.reduce(function (a, b) {
      return a.length > b.length ? a : b
    }));
    
    const href = 'http://' + networkAddress() + ':' + port + '/' + index;
    
    const chromecastClient = Chromecast();
    let foundChromecast = false;
    chromecastClient.on('update', player => {
        if (player.name.toLowerCase() === "living room tv" && !foundChromecast) {
            foundChromecast = true;

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