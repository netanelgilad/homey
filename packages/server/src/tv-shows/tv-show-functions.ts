import { canonizeTVShowName, TVShowEpisode } from "./TVShow";
import { getTVShowInfo, TVShowInfo } from "./getLastEpisodeOfTVShow";
import { Instance } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { join, basename, extname } from "path";
import { search } from "thepiratebay";
import { pad } from "../utils";
import * as networkAddress from "network-address";
import { Device } from "../devices/Device";
import { emitCommand } from "../devices/runCommand";
import { ChangeToChromecastCommand } from "../devices/AllDeviceCommands";
import { find, endsWith, includes, sample, replace } from "lodash";
import { encode } from "base-64";
import * as utf8 from "utf8";
import { Torrent as WebTorrentTorrent } from "webtorrent";
import { Torrent } from "../webtorrent/Torrent";
import {
  PlayVideo,
  DisplayMessage
} from "../chromecasts/ChromecastSideEffects";
import { StartTorrentStreamServer } from "./StreamingServerSideEffects";

export async function downloadTVShowEpisode(
  client: Instance,
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>,
  displayMessage: DisplayMessage,
  tvShow: string,
  season?: number,
  episode?: number
) {
  const tvShowName = canonizeTVShowName(tvShow);

  const {
    tvShowInfo,
    season: foundSeason,
    episode: foundEpisode
  } = await getTVShowData(tvShowName, season, episode);

  console.log(
    `Download episode ${foundEpisode} season ${foundSeason} of ${
      tvShowInfo.tvShowName
    }`
  );

  const torrent = await ensureTorrentForEpisode(
    client,
    downloadedTVShowsCollection,
    displayMessage,
    tvShowInfo,
    foundSeason,
    foundEpisode
  );

  if (!torrent) {
    displayMessage(
      "error",
      `No torrent was found for ${
        tvShowInfo.tvShowName
      } season ${foundSeason} episode ${foundEpisode}!`
    );
  }

  return {
    torrent,
    foundSeason,
    foundEpisode
  };
}

export async function streamTVShowEpisode(
  client: Instance,
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>,
  activeDevice: Device,
  startTorrentStreamServer: StartTorrentStreamServer,
  playVideo: PlayVideo,
  displayMessage: DisplayMessage,
  tvShow: string,
  season?: number,
  episode?: number
) {
  const { torrent, foundSeason, foundEpisode } = await downloadTVShowEpisode(
    client,
    downloadedTVShowsCollection,
    displayMessage,
    tvShow,
    season,
    episode
  );
  if (!torrent) {
    console.log("No torrent was added. Can't stream!");
    return;
  }

  const serverPort = await startTorrentStreamServer(torrent);

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

  playVideo(torrent.files[largestFileIndex].name, href, subtitlesLink);
}

export async function streamRandomTVShowEpisode(
  client: Instance,
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>,
  activeDevice: Device,
  startTorrentStreamServer: StartTorrentStreamServer,
  playVideo: PlayVideo,
  displayMessage: DisplayMessage,
  tvShow: string
) {
  const tvShowName = canonizeTVShowName(tvShow);
  const tvShowInfo = await getTVShowInfo(tvShowName);
  const randomEpisode = sample(tvShowInfo.episodes);

  await streamTVShowEpisode(
    client,
    downloadedTVShowsCollection,
    activeDevice,
    startTorrentStreamServer,
    playVideo,
    displayMessage,
    tvShowName,
    randomEpisode.season,
    randomEpisode.number
  );
}

export async function getTVShowData(
  tvShow: string,
  season: number,
  episode?: number
) {
  const tvShowInfo = await getTVShowInfo(tvShow);

  if (!episode) {
    season = tvShowInfo.previousEpisode.season;
    episode = tvShowInfo.previousEpisode.number;
  } else if (episode >= 100) {
    season = Math.floor(episode / 100);
    episode = episode % 100;
  }

  return { tvShowInfo, season, episode };
}

export function addTorrentToClient(client: Instance, magnetLink: string) {
  client.add(magnetLink, {
    path: join(process.cwd(), "./torrents"),
    announce: ["udp://public.popcorn-tracker.org:6969/announce"]
  });
}

export async function ensureTorrentForEpisode(
  client: Instance,
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>,
  displayMessage: DisplayMessage,
  tvShowInfo: TVShowInfo,
  season: number,
  episode: number
) {
  let downloadedTvShowEpisode = downloadedTVShowsCollection
    .find({
      tvShowName: tvShowInfo.tvShowName,
      season,
      episode
    })
    .value();

  if (!downloadedTvShowEpisode) {
    const magnetLink = await getMagnetLinkFromPiratebay(
      displayMessage,
      canonizeTVShowName(tvShowInfo.tvShowName),
      season,
      episode
    );

    if (!magnetLink) {
      return;
    }

    addTorrentToClient(client, magnetLink);

    console.log(`Torrent added.`);

    downloadedTvShowEpisode = {
      tvShowName: tvShowInfo.tvShowName,
      season,
      episode,
      coverImageUrl: tvShowInfo.coverImageUrl,
      magnetLink
    };

    downloadedTVShowsCollection.push(downloadedTvShowEpisode).write();
  } else {
    console.log("Torrent already added");
  }

  return client.get(downloadedTvShowEpisode.magnetLink) as WebTorrentTorrent;
}

async function getMagnetLinkFromPiratebay(
  displayMessage: DisplayMessage,
  tvShow,
  season,
  episode
) {
  const pirateBayQuery = `${tvShow} s${pad(season)}e${pad(episode)}`;
  console.log("getting torrent from thepiratebay for query", pirateBayQuery);
  const results = await search(pirateBayQuery);

  console.log(`Got ${results.length} results from thepiratebay.`);
  if (results.length === 0) {
    console.log("Oops, not matching results found");
    return;
  }

  const bestTorrent = results[0];
  displayMessage(
    "info",
    `Found best torrent ${bestTorrent.name} with ${bestTorrent.seeders} seeders`
  );
  console.log(
    "found best torrent",
    bestTorrent.name,
    "with",
    bestTorrent.seeders,
    "seeders"
  );
  return bestTorrent.magnetLink;
}

export async function waitForTorrentBytes(
  torrent: WebTorrentTorrent,
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
      .on("end", () => resolve())
      .resume();
  });
}

export async function getSubtitlesLink(
  torrent: WebTorrentTorrent,
  season: number,
  episode: number,
  filePath: string
): Promise<string> {
  const englishSrtFile = find(
    torrent.files,
    file =>
      (endsWith(file.path, ".srt") &&
        (includes(file.path.toLowerCase(), "english") ||
          includes(file.path.toLowerCase(), "eng"))) ||
      replace(basename(filePath), extname(filePath), "") ===
        basename(file.path, ".srt")
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
      `:35601/api/subtitles/${season}/${episode}/${encode(
        utf8.encode(filePath)
      )}`
    );
  }
}

export function originalTorrentToTorrent(torrent: WebTorrentTorrent): Torrent {
  return {
    name: torrent.name,
    progress: torrent.progress,
    downloadSpeed: torrent.downloadSpeed,
    peers: torrent.numPeers,
    timeRemaining: torrent.timeRemaining
  };
}
