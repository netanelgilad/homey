import * as React from "react";
import { SwaggerServer } from "./swagger/SwaggerServer";
import { Lifecycle } from "@react-atoms/core";
import { Database } from "./database/Database";
import { Collection } from "./database/Collection";
import { EmitCommandRestHandler } from "./devices/EmitCommandRestHandler";
import { DownloadTVShowRestHandler } from "./tv-shows/DownloadTVShowRestHandler";
import { WebTorrentClient } from "./webtorrent/WebTorrentClient";
import { TVShowEpisode } from "./tv-shows/TVShow";
import { GetSubtitlesFromFileRestHandler } from "./subtitles/GetSubtitlesFromFileRestHandler";
import { StreamTVShowEpisodeRestHandler } from "./tv-shows/StreamTVShowEpisodeRestHandler";
import { StreamRandomTVShowEpisodeRestHandler } from "./tv-shows/StreamRandomTVShowEpisodeRestHandler";
import { ExpressServer } from "./express/ExpressServer";
import { StaticFilesMiddleware } from "./express/StaticFilesMiddleware";
import { resolve } from "path";
import { GetTorrentsRestHandler } from "./webtorrent/GetTorrentsRestHandler";
import { addTorrentToClient } from "./tv-shows/tv-show-functions";
import { GetTVShowsRestHandler } from "./tv-shows/GetTVShowsRestHandler";
import { ShowApplicationRestHandler } from "./chromecasts/ShowApplicationRestHandler";
import {
  ChromecastSideEffects,
  ChromecastSideEffectsContext
} from "./chromecasts/ChromecastSideEffects";
import {
  RemoteSideEffects,
  RemoteSideEffectsContext
} from "./devices/RemoteSideEffects";
import { ChangeToChromecastCommand } from "./devices/AllDeviceCommands";
import { StreamingServerSideEffects } from "./tv-shows/StreamingServerSideEffects";
import { GetServerStatsRestHandler } from "./stats/GetServerStatsRestHandler";

export function App() {
  return (
    <StreamingServerSideEffects>
      <RemoteSideEffects>
        <ChromecastSideEffects name="Netanels Macbook Pro">
          <Database filePath="homey.json">
            <ExpressServer port={35601}>
              <>
                <SwaggerServer>
                  <GetServerStatsRestHandler />
                  <EmitCommandRestHandler />
                  <WebTorrentClient>
                    {({ client }) => (
                      <>
                        <GetTorrentsRestHandler client={client} />
                        <Collection<TVShowEpisode> name="downloadedTvShows">
                          {({ collection }) => (
                            <>
                              <Lifecycle
                                onDidMount={() => {
                                  console.log(
                                    `Adding existing ${collection
                                      .size()
                                      .value()} torrents.`
                                  );
                                  const existing = collection
                                    .filter(x => !x.done)
                                    .value();
                                  existing.forEach(downloadedTvShow =>
                                    addTorrentToClient(
                                      client,
                                      downloadedTvShow.magnetLink,
                                      () => {
                                        collection
                                          .find({
                                            tvShowName:
                                              downloadedTvShow.tvShowName,
                                            season: downloadedTvShow.season,
                                            episode: downloadedTvShow.episode
                                          })
                                          .assignIn({ done: true })
                                          .write();
                                      }
                                    )
                                  );
                                }}
                              />
                              <GetTVShowsRestHandler
                                client={client}
                                collection={collection}
                              />
                              <DownloadTVShowRestHandler
                                client={client}
                                downloadedTVShowsCollection={collection}
                              />
                              <StreamTVShowEpisodeRestHandler
                                client={client}
                                downloadedTVShowsCollection={collection}
                              />
                              <StreamRandomTVShowEpisodeRestHandler
                                client={client}
                                downloadedTVShowsCollection={collection}
                              />
                            </>
                          )}
                        </Collection>
                      </>
                    )}
                  </WebTorrentClient>
                  <GetSubtitlesFromFileRestHandler />
                  <RemoteSideEffectsContext.Consumer>
                    {({ emitRemoteData }) => (
                      <ChromecastSideEffectsContext.Consumer>
                        {({ showApplication }) => (
                          <ShowApplicationRestHandler
                            onShowApplication={() => {
                              console.log("Changing to chromecast..");
                              emitRemoteData(ChangeToChromecastCommand.data);
                              console.log("Showing application...");
                              showApplication();
                              console.log("Homey is live.");
                            }}
                          />
                        )}
                      </ChromecastSideEffectsContext.Consumer>
                    )}
                  </RemoteSideEffectsContext.Consumer>
                </SwaggerServer>
                <StaticFilesMiddleware
                  path={resolve(__dirname, "../frontend")}
                />
              </>
            </ExpressServer>
          </Database>
        </ChromecastSideEffects>
      </RemoteSideEffects>
    </StreamingServerSideEffects>
  );
}
