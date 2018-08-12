import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { streamTVShowEpisodeRestAction } from "./streamTVShowEpisodeRestAction";
import { streamTVShowEpisode } from "./tv-show-functions";
import { Instance } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { TVShowEpisode } from "./TVShow";
import { ChromecastSideEffectsContext } from "../chromecasts/ChromecastSideEffects";
import { StreamingServerSideEffectsContext } from "./StreamingServerSideEffects";
import { RemoteSideEffectsContext } from "../devices/RemoteSideEffects";
import { ComponentLogger } from "../activity-log/ComponentLogger";

export function StreamTVShowEpisodeRestHandler(props: {
  client: Instance;
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>;
}) {
  return (
    <ComponentLogger name="Downloader">
      {({ log }) => (
        <RemoteSideEffectsContext.Consumer>
          {({ emitRemoteData }) => (
            <StreamingServerSideEffectsContext.Consumer>
              {({ startTorrentStreamServer }) => (
                <ChromecastSideEffectsContext.Consumer>
                  {({ playVideo, showApplication, displayMessage }) => (
                    <RestActionHandler
                      restAction={streamTVShowEpisodeRestAction}
                      handler={({ tvShow, season, episode }) => {
                        showApplication();
                        streamTVShowEpisode(
                          log,
                          props.client,
                          props.downloadedTVShowsCollection,
                          emitRemoteData,
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
          )}
        </RemoteSideEffectsContext.Consumer>
      )}
    </ComponentLogger>
  );
}
