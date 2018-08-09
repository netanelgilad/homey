import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { streamTVShowEpisodeRestAction } from "./streamTVShowEpisodeRestAction";
import { streamTVShowEpisode } from "./tv-show-functions";
import { Instance } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { TVShowEpisode } from "./TVShow";
import { Device } from "../devices/Device";
import { ChromecastSideEffectsContext } from "../chromecasts/ChromecastSideEffects";
import { StreamingServerSideEffectsContext } from "./StreamingServerSideEffects";

export function StreamTVShowEpisodeRestHandler(props: {
  client: Instance;
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>;
  activeDevice: Device;
}) {
  return (
    <StreamingServerSideEffectsContext.Consumer>
      {({ startTorrentStreamServer }) => (
        <ChromecastSideEffectsContext.Consumer>
          {({ playVideo, showApplication, displayMessage }) => (
            <RestActionHandler
              restAction={streamTVShowEpisodeRestAction}
              handler={({ tvShow, season, episode }) => {
                showApplication();
                streamTVShowEpisode(
                  props.client,
                  props.downloadedTVShowsCollection,
                  props.activeDevice,
                  startTorrentStreamServer,
                  playVideo,
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
    </StreamingServerSideEffectsContext.Consumer>
  );
}
