import { BroadlinkDevicesMonitor } from "./devices/BroadlinkDevicesMonitor";
import * as React from "react";
import { SwaggerServer } from "./swagger/SwaggerServer";
import { RestActionHandler } from "./rest-actions/RestActionHandler";
import { getDevicesRestAction } from "./devices/getDevicesRestAction";
import { State, Lifecycle } from "@react-atoms/core";
import { Set } from "immutable";
import { Device } from "./devices/Device";
import { Database } from "./database/Database";
import { Collection } from "./database/Collection";
import { EmitCommandRestHandler } from "./devices/EmitCommandRestHandler";
import { DownloadTVShowRestHandler } from "./tv-shows/DownloadTVShowRestHandler";
import { WebTorrentClient } from "./webtorrent/WebTorrentClient";
import { TVShowEpisode } from "./tv-shows/TVShow";
import { GetSubtitlesFromOpenSubtitlesRestHandler } from "./subtitles/GetSubtitlesFromOpenSubtitlesRestHandler";
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

export function App() {
  return (
    <StreamingServerSideEffects>
      <RemoteSideEffects>
        <ChromecastSideEffects name="Living Room TV">
          <Database filePath="homey.json">
            <ExpressServer port={35601}>
              <>
                <SwaggerServer>
                  <State
                    initialState={{
                      activeDevices: Set<Device>()
                    }}
                  >
                    {({ state, setState }) => (
                      <>
                        <Collection<Device> name="devices">
                          {({ collection }) => (
                            <>
                              <BroadlinkDevicesMonitor
                                onNewDeviceDetected={async device => {
                                  const existingDeviceQuery = collection.find({
                                    host: { macAddress: device.host.macAddress }
                                  });
                                  if (!existingDeviceQuery.value()) {
                                    console.log(
                                      `Detected a new broadlink device with ip ${
                                        device.host.address
                                      }. Writing... `
                                    );
                                    collection.push(device).write();
                                  } else {
                                    existingDeviceQuery.merge(device).write();
                                  }

                                  console.log(
                                    `Broadlink device at ${
                                      device.host.address
                                    } is active.`
                                  );
                                  setState(state => ({
                                    activeDevices: state.activeDevices.add(
                                      device
                                    )
                                  }));
                                }}
                              />
                              <RestActionHandler
                                restAction={getDevicesRestAction}
                                handler={async () => collection.value()}
                              />
                              <EmitCommandRestHandler
                                activeDevice={state.activeDevices.first()}
                              />
                            </>
                          )}
                        </Collection>

                        <WebTorrentClient>
                          {({ client }) => (
                            <>
                              <GetTorrentsRestHandler client={client} />
                              <Collection<
                                TVShowEpisode
                              > name="downloadedTvShows">
                                {({ collection }) => (
                                  <>
                                    <Lifecycle
                                      onDidMount={() => {
                                        console.log(
                                          `Adding existing ${collection
                                            .size()
                                            .value()} torrents.`
                                        );
                                        const existing = collection.value();
                                        existing.forEach(downloadedTvShow =>
                                          addTorrentToClient(
                                            client,
                                            downloadedTvShow.magnetLink
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
                                      activeDevice={state.activeDevices.first()}
                                    />
                                    <StreamRandomTVShowEpisodeRestHandler
                                      client={client}
                                      downloadedTVShowsCollection={collection}
                                      activeDevice={state.activeDevices.first()}
                                    />
                                  </>
                                )}
                              </Collection>
                            </>
                          )}
                        </WebTorrentClient>
                      </>
                    )}
                  </State>
                  <GetSubtitlesFromOpenSubtitlesRestHandler />
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
