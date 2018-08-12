import { api } from "subtitler";
import { find } from "lodash";
import { get } from "http";
import * as gunzip from "gunzip-maybe";
import * as srt2vtt from "srt-to-vtt";
import { extname, basename, dirname, join } from "path";
import { createWriteStream } from "fs";
import { Log } from "../activity-log/ComponentLogger";

export async function downloadSubtitlesFromOpenSubtitles(
  log: Log,
  filePath: string,
  isMatchingResult: (result: any) => boolean
): Promise<string> {
  log({ level: "info", message: `Fetching subtitles for file at ${filePath}` });
  const results = await getResultsFromOpenSubtitles(filePath);

  if (results.length > 0) {
    const subtitle: any = find(results, isMatchingResult);

    if (!subtitle) {
      throw new Error("No matching subtitles where found in results.");
    } else {
      return new Promise<string>((resolve, reject) => {
        try {
          log({
            level: "info",
            message: "Subtitles found. Downloading subtitles file..."
          });
          get(subtitle.SubDownloadLink, response => {
            const videoFileExtenstion = extname(filePath);
            const fileName = basename(filePath, videoFileExtenstion);
            const videoFileDir = dirname(filePath);
            const targetFilePath = join(videoFileDir, `${fileName}.vtt`);
            const fileStream = createWriteStream(targetFilePath);
            const stream = response
              .pipe(gunzip())
              .pipe(srt2vtt())
              .pipe(fileStream);
            stream.on("error", err => {
              reject(err);
            });
            stream.on("close", () => {
              log({ level: "success", message: "Subtitles file downloaded." });
              resolve(targetFilePath);
            });
          });
        } catch (err) {
          reject(err);
        }
      });
    }
  } else {
    throw new Error(`no subtitles found for file ${filePath}`);
  }
}

export async function getResultsFromOpenSubtitles(filePath: string, tries = 3) {
  try {
    const token = await api.login();
    const results = await api.searchForFile(token, "eng", filePath);
    if (results.length === 0) {
      console.log("No results were returned open subtitles. Retrying once.");
      return getResultsFromOpenSubtitles(filePath, 0);
    } else {
      return results;
    }
  } catch (err) {
    console.log("An error occured while getting results from open subtitles.");
    if (tries > 0) {
      console.log("Giving it another try...");
      return getResultsFromOpenSubtitles(filePath, tries - 1);
    }
  }
}
