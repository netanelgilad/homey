import * as WebTorrent from "webtorrent";
import * as networkAddress from "network-address";
import * as Chromecast from "chromecasts";
import { search } from "thepiratebay";
import { runCommand } from "./runCommand";
import { commands } from "./commands";
import { join } from "path";
import * as http from "http"; 
import * as gunzip from "gunzip-maybe";
import * as srt2vtt from "srt-to-vtt";
import * as opensubtitles from "subtitler";
import {encode, decode} from "base-64";
import * as utf8 from "utf8";
import { find, endsWith, includes, minBy } from "lodash";
import { createReadStream } from "fs";
import { safeGet, pad } from "./utils";
import { getDownloadedTvShowEpisode, saveDownloadedTvShowEpisode } from "./tv-shows/db";
import { canonizeTVShowName } from "./tv-shows/TVShow";
import { getLastEpisodeOfTVShow } from "./tv-shows/getLastEpisodeOfTVShow";

const client = new WebTorrent({});
client.on('error', console.log);

export function tvShows(app) {
    app.post('/tv-show/download', async (req, res) => {
        const tvShow = canonizeTVShowName(req.body.tvShow);
        console.log("Got request to download an episode of ", tvShow);

        const {season, episode} = await getTVShowDataFromRequest(tvShow, req);

        console.log(`Downloading torrent for season ${season} and episode ${episode}`);

        const torrent = await ensureTorrentForEpisode(tvShow, season, episode);

        if (!torrent) {
            console.error("Failed to ensure torrent!");
            res.sendStatus(500);
            res.end();
            return;
        }
        
        console.log("torrent queued for download.");
        res.sendStatus(200);
        res.end();
    });

    app.post('/tv-show', async (req, res) => {
        const tvShow = canonizeTVShowName(req.body.tvShow);
        console.log("Got request to stream an episode of ", tvShow);

        const {season, episode} = await getTVShowDataFromRequest(tvShow, req);

        console.log(`Downloading torrent for season ${season} and episode ${episode}`);

        const torrent = await ensureTorrentForEpisode(tvShow, season, episode);

        if (!torrent) {
            res.sendStatus(500);
            res.end();
            return;
        }

        console.log("Torrent ensured, waiting for infoHash of torrent...");

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
            const subtitle: any = find(results, {
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
            res.sendStatus(404);
            res.end();
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
    }).on('error', err => {
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
                        (includes(file.path.toLowerCase(), "english") || includes(file.path.toLowerCase(), "eng")));
        
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

async function getTVShowDataFromRequest(tvShow, req) {
    let season = req.body.season;
    let episode = req.body.episode;

    if (!episode) {
        const showInfo = await safeGet(`http://api.tvmaze.com/singlesearch/shows?q=${tvShow}`);
        const lastEpisodeInfo = await getLastEpisodeOfTVShow(tvShow);
        season = lastEpisodeInfo.season;
        episode = lastEpisodeInfo.episode;
    } else if (episode >= 100) {
        season = Math.floor(episode/100);
        episode = episode % 100;
    }

    return { season, episode };
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

async function ensureTorrentForEpisode(tvShow, season, episode, res?) {
    let downloadedTvShowEpisode = getDownloadedTvShowEpisode(tvShow, season, episode);

    if (!downloadedTvShowEpisode) {
        const magnetLink = await getMagnetLinkFromPiratebay(tvShow, season, episode);

        if (!magnetLink) {
            return;
        }

        const torrent = client.add(magnetLink, {path: join(process.cwd(), "./torrents"), announce: ['udp://public.popcorn-tracker.org:6969/announce']});

        downloadedTvShowEpisode = {
            tvShowName: tvShow,
            season, 
            episode,
            magnetLink
        };

        saveDownloadedTvShowEpisode(downloadedTvShowEpisode);
    }

    return client.get(downloadedTvShowEpisode.magnetLink);
}