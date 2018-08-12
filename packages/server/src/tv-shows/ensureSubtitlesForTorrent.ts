import { getVideoFileFromTorrent } from "./getVideoFileFromTorrent";
import { Torrent, TorrentFile } from "webtorrent";
import { find, endsWith, includes, replace } from "lodash";
import { basename, extname, join } from "path";
import { downloadSubtitlesFromOpenSubtitles } from "../subtitles/downloadSubtitlesFromOpenSubtitles";
import * as networkAddress from "network-address";
import * as srt2vtt from "srt-to-vtt";
import { Log } from "../activity-log/ComponentLogger";

export async function ensureSubtitlesForTorrent(
  log: Log,
  torrent: Torrent,
  isMatchingResultFromOpenSubtitles: (result: any) => boolean
): Promise<string> {
  const videoFile = getVideoFileFromTorrent(torrent);

  let subtitlesFilePath;

  const englishSrtFile = find(
    torrent.files,
    file =>
      (endsWith(file.path, ".srt") &&
        (includes(file.path.toLowerCase(), "english") ||
          includes(file.path.toLowerCase(), "eng"))) ||
      replace(basename(videoFile.path), extname(videoFile.path), "") ===
        basename(file.path, ".srt")
  );

  if (englishSrtFile) {
    return new Promise<string>((resolve, reject) => {
      const stream = englishSrtFile.createReadStream().pipe(srt2vtt);
      stream.on("error", err => reject(err));
      stream.on("end", () => resolve(englishSrtFile.path));
    });
  } else {
    // Wait for the start and end bytes in order to successfully get subtitles
    await waitForTorrentBytes(videoFile, 0, 64 * 1024);
    await waitForTorrentBytes(
      videoFile,
      videoFile.length - 64 * 1024,
      videoFile.length
    );

    subtitlesFilePath = await downloadSubtitlesFromOpenSubtitles(
      log,
      join("./torrents", videoFile.path),
      isMatchingResultFromOpenSubtitles
    );
  }

  return (
    `http://` +
    networkAddress() +
    ":35601/api/subtitles?filePath=" +
    encodeURIComponent(subtitlesFilePath)
  );
}

export async function waitForTorrentBytes(
  torrentFile: TorrentFile,
  start: number,
  end: number
) {
  return new Promise((resolve, reject) => {
    torrentFile
      .createReadStream({
        start,
        end
      })
      .on("error", () => reject())
      .on("end", () => resolve())
      .resume();
  });
}
