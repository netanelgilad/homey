import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { streamRandomTVShowEpisodeRestAction } from "./streamRandomTVShowEpisodeRestAction";
import { streamRandomTVShowEpisode } from "./tv-show-functions";
import { Instance } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { TVShowEpisode } from "./TVShow";
import { ChromecastSideEffectsContext } from "../chromecasts/ChromecastSideEffects";
import { StreamingServerSideEffectsContext } from "./StreamingServerSideEffects";
import { RemoteSideEffectsContext } from "../devices/RemoteSideEffects";
import { ComponentLogger } from "../activity-log/ComponentLogger";

export function StreamRandomTVShowEpisodeRestHandler(props: {
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
                      restAction={streamRandomTVShowEpisodeRestAction}
                      handler={({ tvShow }) => {
                        showApplication();

                        streamRandomTVShowEpisode(
                          log,
                          props.client,
                          props.downloadedTVShowsCollection,
                          emitRemoteData,
                          startTorrentStreamServer,
                          playVideo,
                          displayMessage,
                          tvShow
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
