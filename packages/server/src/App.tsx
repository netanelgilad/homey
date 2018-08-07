import { BroadlinkDevicesMonitor } from "./devices/BroadlinkDevicesMonitor";
import * as React from "react";
import { SwaggerServer } from "./swagger/SwaggerServer";
import { RestActionHandler } from "./rest-actions/RestActionHandler";
import { getDevicesRestAction } from "./devices/getDevicesRestAction";
import { State } from "@react-atoms/core";
import { Set, Map } from "immutable";
import { Device } from "./devices/Device";
import { Database } from "./database/Database";
import { Collection } from "./database/Collection";
import { EmitCommandRestHandler } from "./devices/EmitCommandRestHandler";
import { DownloadTVShowRestHandler } from "./tv-shows/DownloadTVShowRestHandler";
import { WebTorrentClient } from "./webtorrent/WebTorrentClient";
import { TVShowEpisode } from "./tv-shows/TVShow";
import { ChromecastsMonitor } from "./chromecasts/ChromecastsMonitor";
import { Chromecast } from "./chromecasts/Chromecast";
import { GetSubtitlesFromOpenSubtitlesRestHandler } from "./subtitles/GetSubtitlesFromOpenSubtitlesRestHandler";
import { GetSubtitlesFromFileRestHandler } from "./subtitles/GetSubtitlesFromFileRestHandler";
import { StreamTVShowEpisodeRestHandler } from "./tv-shows/StreamTVShowEpisodeRestHandler";
import { StreamRandomTVShowEpisodeRestHandler } from "./tv-shows/StreamRandomTVShowEpisodeRestHandler";
import { ExpressServer } from "./express/ExpressServer";
import { StaticFilesMiddleware } from "./express/StaticFilesMiddleware";
import { resolve } from 'path';

export function App() {
  return (
    <>
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
                                  }. Writing...`
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
                                activeDevices: state.activeDevices.add(device)
                              }));
                            }}
                          />
                          <RestActionHandler
                            restAction={getDevicesRestAction}
                            handler={async () => {
                              return collection.value();
                            }}
                          />
                          <EmitCommandRestHandler
                            activeDevice={state.activeDevices.first()}
                          />
                        </>
                      )}
                    </Collection>

                    <State
                      initialState={{
                        activeChromecasts: Map<string, Chromecast>()
                      }}
                    >
                      {({ state: chromecastsState, setState }) => (
                        <>
                          <ChromecastsMonitor
                            onNewChromecastDiscovered={chromecast => {
                              console.log(
                                `Chromecast ${chromecast.name} is active.`
                              );
                              setState(state => ({
                                activeChromecasts: state.activeChromecasts.set(
                                  chromecast.name,
                                  chromecast
                                )
                              }));
                            }}
                          />
                          <WebTorrentClient>
                            {({ client }) => (
                              <Collection<
                                TVShowEpisode
                              > name="downloadedTvShows">
                                {({ collection }) => (
                                  <>
                                    <DownloadTVShowRestHandler
                                      client={client}
                                      downloadedTVShowsCollection={collection}
                                    />
                                    <StreamTVShowEpisodeRestHandler
                                      client={client}
                                      downloadedTVShowsCollection={collection}
                                      activeDevice={state.activeDevices.first()}
                                      activeChromecast={chromecastsState.activeChromecasts.get(
                                        "Netanels Macbook Pro"
                                      )}
                                    />
                                    <StreamRandomTVShowEpisodeRestHandler
                                      client={client}
                                      downloadedTVShowsCollection={collection}
                                      activeDevice={state.activeDevices.first()}
                                      activeChromecast={chromecastsState.activeChromecasts.get(
                                        "Netanels Macbook Pro"
                                      )}
                                    />
                                  </>
                                )}
                              </Collection>
                            )}
                          </WebTorrentClient>
                        </>
                      )}
                    </State>
                  </>
                )}
              </State>
              <GetSubtitlesFromOpenSubtitlesRestHandler />
              <GetSubtitlesFromFileRestHandler />
            </SwaggerServer>
            <StaticFilesMiddleware path={resolve(__dirname, "./lib/frontend")} />
          </>
        </ExpressServer>
      </Database>
    </>
  );
}
