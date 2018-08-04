import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { getSubtitlesFromOpenSubtitlesRestAction } from "./getSubtitlesFromOpenSubtitlesRestAction";
import * as utf8 from "utf8";
import { decode } from "base-64";
import { api } from "subtitler";
import { join } from "path";
import { find } from "lodash";
import { get } from "http";
import * as gunzip from "gunzip-maybe";
import * as srt2vtt from "srt-to-vtt";
import { Readable } from 'stream';

export function GetSubtitlesFromOpenSubtitlesRestHandler() {
  return (
    <RestActionHandler
      restAction={getSubtitlesFromOpenSubtitlesRestAction}
      handler={async ({ season, episode, filePath }) => {
        console.log("got request for subtitles from opensubtitles");
        filePath = utf8.decode(decode(filePath));
        console.log("fetching subtitles for file at", filePath);
        const token = await api.login();
        const results = await api.searchForFile(
          token,
          "eng",
          join(process.cwd(), "torrents/" + filePath)
        );
        console.log("got results from opensubtitles");

        if (results.length > 0) {
          const subtitle: any = find(results, {
            SeriesSeason: season,
            SeriesEpisode: episode
          });

          if (!subtitle) {
            return;
          } else {
            return new Promise<Readable>(resolve => {
              get(subtitle.SubDownloadLink, response => {
                resolve(response.pipe(gunzip()).pipe(srt2vtt()));
              });
            });
          }
        } else {
          console.log(
            "no subtitles found for file",
            join(process.cwd(), filePath)
          );
          throw new Error("no subtitles found for file");
        }
      }}
    />
  );
}
