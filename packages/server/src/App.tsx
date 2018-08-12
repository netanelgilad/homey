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
import { ActivityLogsSideEffects } from "./activity-log/ActivityLogsSideEffects";
import { GetActivityLogsRestHandler } from "./activity-log/GetActivityLogsRestHandler";
import { ComponentLogger } from "./activity-log/ComponentLogger";
import { RestActionHandler } from "./rest-actions/RestActionHandler";
import { PauseTorrentRestHandler } from "./webtorrent/PauseTorrentsRestHandler";

export function App() {
  return (
    <Database filePath="homey.json">
      <ActivityLogsSideEffects maxSize={100}>
        <>
          <ComponentLogger name="App">
            {({ log }) => (
              <Lifecycle
                onDidCreate={() =>
                  log({ level: "info", message: "Homey server started." })
                }
              />
            )}
          </ComponentLogger>

          <StreamingServerSideEffects>
            <RemoteSideEffects>
              <ChromecastSideEffects name="Netanels Macbook Pro">
                <ExpressServer port={35601}>
                  <>
                    <SwaggerServer>
                      <RestActionHandler
                        restAction={{
                          path: "/exit",
                          method: "post",
                          parameters: {}
                        }}
                        handler={() => {
                          setTimeout(() => process.exit(1), 1000);
                        }}
                      />
                      <GetServerStatsRestHandler />
                      <GetActivityLogsRestHandler />
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
                                                episode:
                                                  downloadedTvShow.episode
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
                                  <PauseTorrentRestHandler
                                    client={client}
                                    downloadsCollection={collection}
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
                                  emitRemoteData(
                                    ChangeToChromecastCommand.data
                                  );
                                  showApplication();
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
              </ChromecastSideEffects>
            </RemoteSideEffects>
          </StreamingServerSideEffects>
        </>
      </ActivityLogsSideEffects>
    </Database>
  );
}
