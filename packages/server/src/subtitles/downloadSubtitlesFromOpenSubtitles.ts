import { api } from "subtitler";
import { find } from "lodash";
import { get } from "http";
import * as gunzip from "gunzip-maybe";
import * as srt2vtt from "srt-to-vtt";
import { extname, basename, dirname, join } from "path";
import { createWriteStream } from "fs";

export async function downloadSubtitlesFromOpenSubtitles(
  filePath: string,
  isMatchingResult: (result: any) => boolean
): Promise<string> {
  console.log("fetching subtitles for file at", filePath);
  const results = await getResultsFromOpenSubtitles(filePath);

  if (results.length > 0) {
    console.log(`got ${results.length} results from opensubtitles`);
    const subtitle: any = find(results, isMatchingResult);

    if (!subtitle) {
      throw new Error("No matching subtitles where found in results.");
    } else {
      return new Promise<string>((resolve, reject) => {
        try {
          console.log("Downloading subtitles file...");
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
              console.log("subtitles file downloaded.");
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
