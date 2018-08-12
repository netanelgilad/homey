import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { downloadTVShowRestAction } from "./downloadTVShowRestAction";
import { downloadTVShowEpisode } from "./tv-show-functions";
import { Instance } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { TVShowEpisode } from "./TVShow";
import { ChromecastSideEffectsContext } from "../chromecasts/ChromecastSideEffects";
import { ComponentLogger } from "../activity-log/ComponentLogger";

export function DownloadTVShowRestHandler(props: {
  client: Instance;
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>;
}) {
  return (
    <ComponentLogger name="Downloader">
      {({ log }) => (
        <ChromecastSideEffectsContext.Consumer>
          {({ displayMessage, showApplication }) => (
            <RestActionHandler
              restAction={downloadTVShowRestAction}
              handler={async ({ tvShow, season, episode }) => {
                log({
                  level: "info",
                  message: `Got request to download episode ${episode} season ${season ||
                    "NA"} of ${tvShow}`
                });

                showApplication();
                await downloadTVShowEpisode(
                  log,
                  props.client,
                  props.downloadedTVShowsCollection,
                  displayMessage,
                  tvShow,
                  season,
                  episode
                );
              }}
            />
          )}
        </ChromecastSideEffectsContext.Consumer>
      )}
    </ComponentLogger>
  );
}
