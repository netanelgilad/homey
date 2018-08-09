import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { downloadTVShowRestAction } from "./downloadTVShowRestAction";
import { downloadTVShowEpisode } from "./tv-show-functions";
import { Instance } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { TVShowEpisode } from "./TVShow";
import { ChromecastSideEffectsContext } from "../chromecasts/ChromecastSideEffects";

export function DownloadTVShowRestHandler(props: {
  client: Instance;
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>;
}) {
  return (
    <ChromecastSideEffectsContext.Consumer>
      {({ displayMessage, showApplication }) => (
        <RestActionHandler
          restAction={downloadTVShowRestAction}
          handler={async ({ tvShow, season, episode }) => {
            showApplication();
            await downloadTVShowEpisode(
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
  );
}
