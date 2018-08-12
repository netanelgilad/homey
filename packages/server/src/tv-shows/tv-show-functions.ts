import { canonizeTVShowName, TVShowEpisode } from "./TVShow";
import { getTVShowInfo, TVShowInfo } from "./getLastEpisodeOfTVShow";
import { Instance } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { join, basename, extname } from "path";
import { search } from "thepiratebay";
import { pad } from "../utils";
import * as networkAddress from "network-address";
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
import { EmitRemoteData } from "../devices/RemoteSideEffects";
import { ensureSubtitlesForTorrent } from "./ensureSubtitlesForTorrent";
import { Log } from "../activity-log/ComponentLogger";

export async function downloadTVShowEpisode(
  log: Log,
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

  log({
    level: "info",
    message: `Ensuring download of episode ${foundEpisode} season ${foundSeason} of ${
      tvShowInfo.tvShowName
    }`
  });

  const torrent = await ensureTorrentForEpisode(
    client,
    downloadedTVShowsCollection,
    displayMessage,
    tvShowInfo,
    foundSeason,
    foundEpisode
  );
  let subtitlesUrl;

  if (!torrent) {
    log({
      level: "error",
      message: `No torrent was found for ${
        tvShowInfo.tvShowName
      } season ${foundSeason} episode ${foundEpisode}!`
    });
  } else {
    try {
      subtitlesUrl = await ensureSubtitlesForTorrent(
        log,
        torrent,
        result =>
          result.SeriesSeason === foundSeason &&
          result.SeriesEpisode === foundEpisode
      );

      downloadedTVShowsCollection
        .find({
          tvShowName: tvShowInfo.tvShowName,
          season,
          episode
        })
        .assignIn({ subtitlesUrl })
        .write();
    } catch (err) {
      log({
        level: "error",
        message: `Failed to get subtitles for torrent ${torrent.name}. ${err}`
      });
    }
  }

  return {
    torrent,
    subtitlesUrl,
    foundSeason,
    foundEpisode
  };
}

export async function streamTVShowEpisode(
  log: Log,
  client: Instance,
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>,
  emitRemoteData: EmitRemoteData,
  startTorrentStreamServer: StartTorrentStreamServer,
  playVideo: PlayVideo,
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

  let downloadedTvShowEpisode = downloadedTVShowsCollection
    .find({
      tvShowName: tvShowInfo.tvShowName,
      season,
      episode
    })
    .value();

  let videoUrl, subtitlesLink;

  if (downloadedTvShowEpisode && downloadedTvShowEpisode.done) {
    videoUrl = encodeURI(
      "http://" +
        networkAddress() +
        `:35601/tv-shows/stream/downloaded/${tvShowName}/${foundSeason}/${foundEpisode}`
    );
    subtitlesLink = downloadedTvShowEpisode.subtitlesUrl;
  } else {
    const { torrent, subtitlesUrl } = await downloadTVShowEpisode(
      log,
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

    log({
      level: "info",
      message: "server and torrent are ready, streaming to chromecast..."
    });

    var largestFileIndex = torrent.files.indexOf(
      torrent.files.reduce((a, b) => (a.length > b.length ? a : b))
    );

    videoUrl =
      "http://" + networkAddress() + ":" + serverPort + "/" + largestFileIndex;

    subtitlesLink = subtitlesUrl;
  }

  console.log("Changing to chromecast");
  emitRemoteData(ChangeToChromecastCommand.data);

  playVideo(
    `${tvShowInfo.tvShowName} s${pad(foundSeason)}e${pad(foundEpisode)}`,
    videoUrl,
    subtitlesLink
  );
}

export async function streamRandomTVShowEpisode(
  log: Log,
  client: Instance,
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>,
  emitRemoteData: EmitRemoteData,
  startTorrentStreamServer: StartTorrentStreamServer,
  playVideo: PlayVideo,
  displayMessage: DisplayMessage,
  tvShow: string
) {
  const tvShowName = canonizeTVShowName(tvShow);
  const tvShowInfo = await getTVShowInfo(tvShowName);
  const randomEpisode = sample(tvShowInfo.episodes);

  log({
    level: "info",
    message: `Streaming random episode ${randomEpisode.number} season ${
      randomEpisode.season
    } of ${tvShowInfo.tvShowName}`
  });

  await streamTVShowEpisode(
    log,
    client,
    downloadedTVShowsCollection,
    emitRemoteData,
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

export function addTorrentToClient(
  client: Instance,
  magnetLink: string,
  onTorrentDone: () => void
) {
  return new Promise<WebTorrentTorrent>(resolve => {
    client.add(
      magnetLink,
      {
        path: join(process.cwd(), "./torrents"),
        announce: [
          "udp://public.popcorn-tracker.org:6969/announce",
          "udp://tracker.openbittorrent.com:80",
          "udp://tracker.publicbt.com:80",
          "udp://tracker.istole.it:80",
          "udp://tracker.btzoo.eu:80/announce",
          "http://opensharing.org:2710/announce",
          "udp://open.demonii.com:1337/announce",
          "http://announce.torrentsmd.com:8080/announce.php",
          "http://announce.torrentsmd.com:6969/announce",
          "http://bt.careland.com.cn:6969/announce",
          "http://i.bandito.org/announce",
          "http://bttrack.9you.com/announce"
        ]
      },
      torrent => {
        torrent.on("done", () => {
          torrent.destroy();
          onTorrentDone();
        });
        resolve(torrent);
      }
    );
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

    const torrent = await addTorrentToClient(client, magnetLink, () => {
      downloadedTVShowsCollection
        .find({
          tvShowName: tvShowInfo.tvShowName,
          season,
          episode
        })
        .assignIn({ done: true })
        .write();
    });

    var largestFileIndex = torrent.files.indexOf(
      torrent.files.reduce((a, b) => (a.length > b.length ? a : b))
    );

    console.log(`Torrent added.`);

    downloadedTvShowEpisode = {
      tvShowName: tvShowInfo.tvShowName,
      season,
      episode,
      coverImageUrl: tvShowInfo.coverImageUrl,
      magnetLink,
      filePath: join(
        process.cwd(),
        "./torrents",
        torrent.files[largestFileIndex].path
      )
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
