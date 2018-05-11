const WEbTorrent = require('webtorrent');
const networkAddress = require('network-address');
const Chromecast = require('chromecasts');
const {search} = require("thepiratebay");
const { get } = require('axios');
const { runCommand } = require('./runCommand');
const commands = require('./commands');
const downloadTarball = require("download-tarball");
const { join } = require("path");
const http = require("http");
const gunzip = require("gunzip-maybe");
const srt2vtt = require('srt-to-vtt')
const opensubtitles = require('subtitler');
const {encode, decode} = require('base-64');
const utf8 = require('utf8');
const { find, endsWith, includes } = require('lodash');
const {createReadStream} = require('fs');

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
        let season = req.body.season;
        let episode = req.body.episode;

        if (!episode) {
            console.log("Got request to stream the last episode of", tvShow);

            if (tvShow.startsWith("of ")) {
                tvShow = tvShow.replace("of ", "");
            }
    
            tvShow = tvShow.replace("'", "");
            tvShow = tvShow.replace(/ \w /, " ");
    
            const showInfo = await safeGet(`http://api.tvmaze.com/singlesearch/shows?q=${tvShow}`);
            const lastEpisodeInfo = await safeGet(showInfo._links.previousepisode.href);
            season = lastEpisodeInfo.season;
            episode = lastEpisodeInfo.number;
        } else if (episode >= 100) {
            season = Math.floor(episode/100);
            episode = episode % 100;
        }
        
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
                else torrent.once('ready', () => onReady(torrent, server.address().port, req, res))
            }).on('error', function (err) {
                if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
                  // If port is taken, pick one a free one automatically
                  return server.listen(0, initServer)
                }
                console.log(err);
              });
        });
    });

    app.get("/subtitles/:fileBase", async (req, res) => {
        console.log("got request for subtitles");
        const filePath = utf8.decode(decode(req.params.fileBase));
        const token = await opensubtitles.api.login();
        console.log(join(process.cwd(), filePath));
        const results = await opensubtitles.api.searchForFile(token, "en", join(process.cwd(), filePath));
        http.get(results[0].SubDownloadLink, response => {
            response.pipe(gunzip()).pipe(srt2vtt()).pipe(res);
        })
    });

    app.get("/subtitles/srt/:fileBase", async (req, res) => {
        console.log("got request for subtitles");
        const filePath = utf8.decode(decode(req.params.fileBase));

        createReadStream(filePath)
            .pipe(srt2vtt())
            .pipe(res);
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
    chromecastClient.on('update', async player => {
        if (player.name.toLowerCase() === "living room tv" && !foundChromecast) {
            console.log("found chromecast, changing source and streaming...");
            foundChromecast = true;

            console.log("Changing to chromecast");
            const command = commands.find((e) => { return e.command == "change_to_Chromecast"; });
            runCommand(command, req, res);

            const englishSrtFile = find(torrent.files, file => endsWith(file.path, ".srt") && 
                (includes(file.path.toLowerCase(), "english") || includes(file.path.toLowerCase("eng"))));

            let subtitlesLink;
            if (englishSrtFile) {
                console.log("found english sub file, waiting for download..");
                subtitlesLink = 'http://' + networkAddress() + `:35601/subtitles/srt/${encode(utf8.encode(englishSrtFile.path))}`
                englishSrtFile.createReadStream().on('end', () => {
                    console.log("done download sub file. playing...");
                    player.play(href, {
                        title: 'Homey - ' + torrent.files[index].name,
                        subtitles: [subtitlesLink],
                        autoSubtitles: true
                    });
                });
            }
            else {
                subtitlesLink = 'http://' + networkAddress() + `:35601/subtitles/${encode(utf8.encode(torrent.files[index].path))}`;
                console.log("playing...");
                player.play(href, {
                    title: 'Homey - ' + torrent.files[index].name,
                    subtitles: [subtitlesLink],
                    autoSubtitles: true
                });
            }
            
            player.on('error', err => {
                err.message = 'Chromecast: ' + err.message
                console.log(err);
            })
        }
    });
}