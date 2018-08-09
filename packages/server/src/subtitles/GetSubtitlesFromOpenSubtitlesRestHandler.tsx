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
import { Readable } from "stream";
import { ChromecastSideEffectsContext } from "../chromecasts/ChromecastSideEffects";

export function GetSubtitlesFromOpenSubtitlesRestHandler() {
  return (
    <ChromecastSideEffectsContext.Consumer>
      {({ displayMessage }) => (
        <RestActionHandler
          restAction={getSubtitlesFromOpenSubtitlesRestAction}
          handler={async ({ season, episode, filePath }) => {
            try {
              console.log("got request for subtitles from opensubtitles");
              filePath = utf8.decode(decode(filePath));
              console.log("fetching subtitles for file at", filePath);
              const token = await api.login();
              const results = await api.searchForFile(
                token,
                "eng",
                join(process.cwd(), "torrents/" + filePath)
              );

              if (results.length > 0) {
                console.log(`got ${results.length} results from opensubtitles`);
                const subtitle: any = find(results, {
                  SeriesSeason: season,
                  SeriesEpisode: episode
                });

                if (!subtitle) {
                  displayMessage(
                    "warning",
                    "Failed to find subtitles from open subtitles..."
                  );
                  return;
                } else {
                  return new Promise<Readable>(resolve => {
                    get(subtitle.SubDownloadLink, response => {
                      resolve(response.pipe(gunzip()).pipe(srt2vtt()));
                    });
                  });
                }
              } else {
                displayMessage(
                  "warning",
                  "Failed to find subtitles from open subtitles..."
                );
                console.log(
                  "no subtitles found for file",
                  join(process.cwd(), filePath)
                );
              }
            } catch (err) {
              displayMessage(
                "warning",
                "Failed to find subtitles from open subtitles..."
              );
              console.error(
                "An error occured trying to get subtitles from open subtitles",
                err
              );
            }
          }}
        />
      )}
    </ChromecastSideEffectsContext.Consumer>
  );
}
