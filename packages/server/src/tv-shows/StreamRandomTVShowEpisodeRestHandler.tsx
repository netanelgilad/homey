import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { streamRandomTVShowEpisodeRestAction } from "./streamRandomTVShowEpisodeRestAction";
import { streamRandomTVShowEpisode } from "./tv-show-functions";
import { Instance } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { TVShowEpisode } from "./TVShow";
import { Device } from "../devices/Device";
import { ChromecastSideEffectsContext } from "../chromecasts/ChromecastSideEffects";
import { StreamingServerSideEffectsContext } from "./StreamingServerSideEffects";

export function StreamRandomTVShowEpisodeRestHandler(props: {
  client: Instance;
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>;
  activeDevice: Device;
}) {
  return (
    <StreamingServerSideEffectsContext.Consumer>
      {({ startTorrentStreamServer }) => (
        <ChromecastSideEffectsContext.Consumer>
          {({ playVideo }) => (
            <RestActionHandler
              restAction={streamRandomTVShowEpisodeRestAction}
              handler={({ tvShow }) => {
                streamRandomTVShowEpisode(
                  props.client,
                  props.downloadedTVShowsCollection,
                  props.activeDevice,
                  startTorrentStreamServer,
                  playVideo,
                  tvShow
                );
              }}
            />
          )}
        </ChromecastSideEffectsContext.Consumer>
      )}
    </StreamingServerSideEffectsContext.Consumer>
  );
}
