import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { streamRandomTVShowEpisodeRestAction } from "./streamRandomTVShowEpisodeRestAction";
import { streamRandomTVShowEpisode } from "./tv-show-functions";
import { Instance } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { TVShowEpisode } from "./TVShow";
import { Device } from "../devices/Device";
import { ChromecastSideEffectsContext } from "../chromecasts/ChromecastSideEffects";

export function StreamRandomTVShowEpisodeRestHandler(props: {
  client: Instance;
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>;
  activeDevice: Device;
}) {
  return (
    <ChromecastSideEffectsContext.Consumer>
      {({ playVideo }) => (
        <RestActionHandler
          restAction={streamRandomTVShowEpisodeRestAction}
          handler={({ tvShow }) => {
            streamRandomTVShowEpisode(
              props.client,
              props.downloadedTVShowsCollection,
              props.activeDevice,
              playVideo,
              tvShow
            );
          }}
        />
      )}
    </ChromecastSideEffectsContext.Consumer>
  );
}
