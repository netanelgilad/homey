const WEbTorrent = require('webtorrent');
const networkAddress = require('network-address');
const Chromecast = require('chromecasts');
const {search} = require("thepiratebay");
const { get } = require('axios');
const { runCommand } = require('./runCommand');
const commands = require('./commands');
const downloadTarball = require("download-tarball");
const { join, basename } = require("path");
const http = require("http");
const gunzip = require("gunzip-maybe");
const srt2vtt = require('srt-to-vtt')
const opensubtitles = require('subtitler');
const {encode, decode} = require('base-64');
const utf8 = require('utf8');
const { find, endsWith, includes, minBy } = require('lodash');
const {createReadStream} = require('fs');
const levenshtein = require('fast-levenshtein');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter);

db.defaults({ streamableEpisodes: [] })
  .write();

const client = new WEbTorrent({});
client.on('error', console.log);

const pad = (number) => number < 10 ? `0${number}` : String(number);

function cleanFileName(file) {
    return basename(file).substr(0, basename(file).lastIndexOf('.'));
}

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
    app.post('/tv-show/download', async (req, res) => {
        const {tvShow, season, episode} = await getTVShowDataFromRequest(req, res);

        console.log(`Downloading torrent for season ${season} and episode ${episode}`);

        const torrent = await ensureTorrentForEpisode(tvShow, season, episode);
        if (!torrent) {
            res.sendStatus(500);
            res.end();
            return;
        }
        
        console.log("torrent queued for download.");
        res.sendStatus(200);
        res.end();
    });

    app.post('/tv-show', async (req, res) => {
        const {tvShow, season, episode} = await getTVShowDataFromRequest(req, res);
        
        console.log(`Downloading torrent for season ${season} and episode ${episode}`);

        const torrent = await ensureTorrentForEpisode(tvShow, season, episode);
        if (!torrent) {
            res.sendStatus(500);
            res.end();
            return;
        }

        if (torrent.infoHash) onInfoHash(torrent, req, res, season, episode);
        else torrent.on('infoHash', () => onInfoHash(torrent, req, res, season, episode));
    });

    app.get("/subtitles/:season/:episode/:fileBase", async (req, res) => {
        console.log("got request for subtitles from opensubtitles");
        const filePath = utf8.decode(decode(req.params.fileBase));
        const season = req.params.season;
        const episode = req.params.episode;
        console.log("fetching subtitles for file at", filePath);
        const token = await opensubtitles.api.login();
        const results = await opensubtitles.api.searchForFile(token, "eng", join(process.cwd(), "torrents/" + filePath));
        console.log("got results from opensubtitles");

        if (results.length > 0) {
            const subtitle = find(results, {
                SeriesSeason: season,
                SeriesEpisode: episode
            });

            if (!subtitle) {
                res.sendStatus(404);
                res.end();
            }
            else {
                http.get(subtitle.SubDownloadLink, response => {
                    response.pipe(gunzip()).pipe(srt2vtt()).pipe(res);
                });
            }
        }
        else {
            console.log("no subtitles found for file", join(process.cwd(), filePath));
        }
    });

    app.get("/subtitles/srt/:fileBase", async (req, res) => {
        console.log("got request for subtitles/srt");
        const filePath = utf8.decode(decode(req.params.fileBase));

        createReadStream(filePath)
            .pipe(srt2vtt())
            .pipe(res);
    });
}

function onInfoHash(torrent, req, res, season, episode) {
    console.log("Got torrent infoHas, creating server...");
    const server = torrent.createServer();
    server.listen(0, () => {
        console.log("server started on ", server.address());
        if (torrent.ready) onReady(torrent, server.address().port, req, res, season, episode)
        else torrent.once('ready', () => onReady(torrent, server.address().port, req, res, season, episode))
    }).on('error', function (err) {
        if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
          // If port is taken, pick one a free one automatically
          return server.listen(0, initServer)
        }
        console.log(err);
      });
}

function onReady(torrent, port, req, res, season, episode) {
    console.log("server and torrent are ready, streaming to chromecast...");
    var index = torrent.files.indexOf(torrent.files.reduce(function (a, b) {
      return a.length > b.length ? a : b
    }));

    torrent.files[index].createReadStream({
        start: 0,
        end: 64 * 1024
    }).on('end', () => {
        torrent.files[index].createReadStream({
            start: torrent.files[index].length - 64 * 1024,
            end: torrent.files[index].length
        }).on('end', () => {
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
                        englishSrtFile.getBuffer((err) => {
                            if (err) {
                                console.log("failed to get substitles file. Trying from open subtitles...");
                                subtitlesLink = 'http://' + networkAddress() + `:35601/subtitles/${season}/${episode}/${encode(utf8.encode(torrent.files[index].path))}`;
                            }
                            else {
                                console.log("done download sub file. playing...");
                            }
                            
                            player.play(href, {
                                title: 'Homey - ' + torrent.files[index].name,
                                subtitles: [subtitlesLink],
                                autoSubtitles: true
                            });
                        });
                    }
                    else {
                        subtitlesLink = 'http://' + networkAddress() + `:35601/subtitles/${season}/${episode}/${encode(utf8.encode(torrent.files[index].path))}`;
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
                    });

                    player.on('Status', status => {
                        console.log("Chromecast status", status);
                    })
                }
            });
        }).resume();
    }).resume();
}

async function getTVShowDataFromRequest(req, res) {
    let tvShow = req.body.tvShow;

    if (tvShow.startsWith("of ") || tvShow.startsWith(" of ")) {
        tvShow = tvShow.replace("of", "");
    }

    tvShow = tvShow.replace(" ' ", "");
    tvShow = tvShow.replace("'", "");
    tvShow = tvShow.replace(/ \w /, " ");
    tvShow = tvShow.replace("-", " ");

    console.log("got request to stream tv show", tvShow);
    let season = req.body.season;
    let episode = req.body.episode;

    if (!episode) {
        console.log("Got request to stream the last episode of", tvShow);

        const showInfo = await safeGet(`http://api.tvmaze.com/singlesearch/shows?q=${tvShow}`);
        const lastEpisodeInfo = await safeGet(showInfo._links.previousepisode.href);
        season = lastEpisodeInfo.season;
        episode = lastEpisodeInfo.number;
    } else if (episode >= 100) {
        season = Math.floor(episode/100);
        episode = episode % 100;
    }

    return { tvShow, season, episode };
}

async function getMagnetLinkFromPiratebay(tvShow, season, episode) {
    const pirateBayQuery = `${tvShow} s${pad(season)}e${pad(episode)}`;
        console.log("getting torrent from thepiratebay for query", pirateBayQuery)
        const results = await search(pirateBayQuery);

        console.log(`Got ${results.length} results from thepiratebay.`);
        if (results.length === 0) {
            console.log("Oops, not matching results found");
            return;
        }

        const bestTorrent = results[0];
        console.log("found best torrent", bestTorrent.name, "with", bestTorrent.seeders, "seeders");
        return bestTorrent.magnetLink;
}

const streamableEpisodes = [];

async function ensureTorrentForEpisode(tvShow, season, episode, res) {
    let streamableEpisode = find(streamableEpisodes,{
        tvShow,
        season,
        episode
    });

    if (!streamableEpisode) {
        const magnetLink = await getMagnetLinkFromPiratebay(tvShow, season, episode);

        if (!magnetLink) {
            return;
        }

        const torrent = client.add(magnetLink, {path: join(process.cwd(), "./torrents"), announce: ['udp://public.popcorn-tracker.org:6969/announce']});
        streamableEpisode = {
            tvShow,
            season, 
            episode,
            torrent
        };

        streamableEpisodes
            .push(streamableEpisode);
    }

    return streamableEpisode.torrent;
}