import { canonizeTVShowName, TVShowEpisode } from "./TVShow";
import { getLastEpisodeOfTVShow } from "./getLastEpisodeOfTVShow";
import { Instance, Torrent } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { join } from "path";
import { search } from "thepiratebay";
import { pad } from "../utils";
import { AddressInfo } from "net";
import * as networkAddress from "network-address";
import { Device } from "../devices/Device";
import { emitCommand } from "../devices/runCommand";
import { ChangeToChromecastCommand } from "../devices/AllDeviceCommands";
import { find, endsWith, includes } from "lodash";
import { encode } from "base-64";
import * as utf8 from "utf8";
import { Chromecast } from "../chromecasts/Chromecast";

export async function downloadTVShowEpisode(
  client: Instance,
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>,
  tvShow: string,
  season?: number,
  episode?: number
) {
  const tvShowName = canonizeTVShowName(tvShow);

  const { season: foundSeason, episode: foundEpisode } = await getTVShowData(
    tvShowName,
    season,
    episode
  );

  console.log(
    `Download episode ${foundEpisode} season ${foundSeason} of ${tvShowName}`
  );

  return {
    torrent: await ensureTorrentForEpisode(
      client,
      downloadedTVShowsCollection,
      tvShowName,
      foundSeason,
      foundEpisode
    ),
    foundSeason,
    foundEpisode
  };
}

export async function streamTVShowEpisode(
  client: Instance,
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>,
  activeDevice: Device,
  activeChromecast: Chromecast,
  tvShow: string,
  season?: number,
  episode?: number
) {
  const { torrent, foundSeason, foundEpisode } = await downloadTVShowEpisode(
    client,
    downloadedTVShowsCollection,
    tvShow,
    season,
    episode
  );

  const serverPort = await createStreamingServer(torrent);

  console.log("server and torrent are ready, streaming to chromecast...");

  var largestFileIndex = torrent.files.indexOf(
    torrent.files.reduce((a, b) => (a.length > b.length ? a : b))
  );

  // Wait for the start and end bytes in order to successfully get subtitles
  await waitForTorrentBytes(torrent, largestFileIndex, 0, 64 * 1024);
  await waitForTorrentBytes(
    torrent,
    largestFileIndex,
    torrent.files[largestFileIndex].length - 64 * 1024,
    torrent.files[largestFileIndex].length
  );

  console.log("Changing to chromecast");
  emitCommand(activeDevice, ChangeToChromecastCommand);

  const href =
    "http://" + networkAddress() + ":" + serverPort + "/" + largestFileIndex;
    
  const subtitlesLink = await getSubtitlesLink(
    torrent,
    foundSeason,
    foundEpisode,
    torrent.files[largestFileIndex].path
  );

  activeChromecast.play(href, {
    title: "Homey - " + torrent.files[largestFileIndex].name,
    subtitles: [subtitlesLink],
    autoSubtitles: true
  });
}

export async function getTVShowData(
  tvShow: string,
  season: number,
  episode?: number
) {
  if (!episode) {
    const lastEpisodeInfo = await getLastEpisodeOfTVShow(tvShow);
    season = lastEpisodeInfo.season;
    episode = lastEpisodeInfo.episode;
  } else if (episode >= 100) {
    season = Math.floor(episode / 100);
    episode = episode % 100;
  }

  return { season, episode };
}

export async function ensureTorrentForEpisode(
  client: Instance,
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>,
  tvShow: string,
  season: number,
  episode: number
) {
  let downloadedTvShowEpisode = downloadedTVShowsCollection
    .find({
      tvShowName: tvShow,
      season,
      episode
    })
    .value();

  if (!downloadedTvShowEpisode) {
    const magnetLink = await getMagnetLinkFromPiratebay(
      tvShow,
      season,
      episode
    );

    if (!magnetLink) {
      return;
    }

    client.add(magnetLink, {
      path: join(process.cwd(), "./torrents"),
      announce: ["udp://public.popcorn-tracker.org:6969/announce"]
    });

    console.log(`Torrent added.`);

    downloadedTvShowEpisode = {
      tvShowName: tvShow,
      season,
      episode,
      magnetLink
    };

    downloadedTVShowsCollection.push(downloadedTvShowEpisode).write();
  } else {
    console.log("Torrent already added");
  }

  return client.get(downloadedTvShowEpisode.magnetLink) as Torrent;
}

async function getMagnetLinkFromPiratebay(tvShow, season, episode) {
  const pirateBayQuery = `${tvShow} s${pad(season)}e${pad(episode)}`;
  console.log("getting torrent from thepiratebay for query", pirateBayQuery);
  const results = await search(pirateBayQuery);

  console.log(`Got ${results.length} results from thepiratebay.`);
  if (results.length === 0) {
    console.log("Oops, not matching results found");
    return;
  }

  const bestTorrent = results[0];
  console.log(
    "found best torrent",
    bestTorrent.name,
    "with",
    bestTorrent.seeders,
    "seeders"
  );
  return bestTorrent.magnetLink;
}

export async function createStreamingServer(torrent: Torrent) {
  await waitForInfoHash(torrent);

  console.log("Got torrent infoHas, creating server...");

  const serverPort = await createTorrentServer(torrent);

  await waitForTorrentReady(torrent);

  return serverPort;
}

export async function waitForInfoHash(torrent: Torrent) {
  return new Promise(resolve => {
    if (torrent.infoHash) resolve();
    else torrent.on("infoHash", resolve);
  });
}

export async function waitForTorrentReady(torrent: Torrent) {
  return new Promise(resolve => {
    if (torrent.ready) resolve();
    else torrent.once("ready", resolve);
  });
}

export async function createTorrentServer(torrent: Torrent): Promise<number> {
  return new Promise<number>(resolve => {
    const server = torrent.createServer();
    server.on("error", err => {
      console.log(err);
    });

    server.listen(0, () => {
      console.log("server started on ", server.address());
      resolve((server.address() as AddressInfo).port);
    });
  });
}

export async function waitForTorrentBytes(
  torrent: Torrent,
  fileIndex: number,
  start: number,
  end: number
) {
  return new Promise((resolve, reject) => {
    torrent.files[fileIndex]
      .createReadStream({
        start,
        end
      })
      .on("error", () => reject())
      .on("end", () => resolve()).resume();
  });
}

export async function getSubtitlesLink(
  torrent: Torrent,
  season: number,
  episode: number,
  filePath: string
): Promise<string> {
  const englishSrtFile = find(
    torrent.files,
    file =>
      endsWith(file.path, ".srt") &&
      (includes(file.path.toLowerCase(), "english") ||
        includes(file.path.toLowerCase(), "eng"))
  );

  let subtitlesLink;
  if (englishSrtFile) {
    console.log("found english sub file, waiting for download..");
    subtitlesLink =
      "http://" +
      networkAddress() +
      `:35601/api/subtitles/srt/${encode(utf8.encode(englishSrtFile.path))}`;
    return new Promise<string>(resolve => {
      englishSrtFile.getBuffer(err => {
        if (err) {
          console.log(
            "failed to get substitles file. Trying from open subtitles..."
          );
          resolve(
            "http://" +
              networkAddress() +
              `:35601/subtitles/${season}/${episode}/${encode(
                utf8.encode(filePath)
              )}`
          );
        } else {
          resolve(subtitlesLink);
        }
      });
    });
  } else {
    return (
      "http://" +
      networkAddress() +
      `:35601/api/subtitles/${season}/${episode}/${encode(utf8.encode(filePath))}`
    );
  }
}
