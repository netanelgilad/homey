import { BroadlinkDevicesMonitor } from "./devices/BroadlinkDevicesMonitor";
import * as React from "react";
import { SwaggerServer } from "./swagger/SwaggerServer";
import { RestActionHandler } from "./rest-actions/RestActionHandler";
import { getDevicesRestAction } from "./devices/getDevicesRestAction";
import { State } from "@react-atoms/core";
import { Set } from "immutable";
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
import { GetSubtitlesFromFileRestHandler } from './subtitles/GetSubtitlesFromFileRestHandler';

export function App() {
  return (
    <>
      <Database filePath="homey.json">
        <SwaggerServer port={3300}>
          <State
            initialState={{
              activeDevices: Set<Device>()
            }}
          >
            {({ state, setState }) => (
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
            )}
          </State>
          <Collection<Chromecast> name="chromecasts">
            {({ collection }) => (
              <State
                initialState={{
                  activeChromecasts: Set<Chromecast>()
                }}
              >
                {({ setState }) => (
                  <>
                    <ChromecastsMonitor
                      onNewChromecastDiscovered={chromecast => {
                        const existingChromecast = collection.find({
                          name: chromecast.name
                        });
                        if (!existingChromecast.value()) {
                          console.log(
                            `Discovered a new chromecast called ${
                              chromecast.name
                            }.`
                          );
                          collection.push(chromecast).write();
                        }
                        console.log(`Chromecast ${chromecast.name} is active.`);
                        setState(state => ({
                          activeChromecasts: state.activeChromecasts.add(
                            chromecast
                          )
                        }));
                      }}
                    />
                    <WebTorrentClient>
                      {({ client }) => (
                        <Collection<TVShowEpisode> name="downloadedTvShows">
                          {({ collection }) => (
                            <DownloadTVShowRestHandler
                              client={client}
                              downloadedTVShowsCollection={collection}
                            />
                          )}
                        </Collection>
                      )}
                    </WebTorrentClient>
                  </>
                )}
              </State>
            )}
          </Collection>
          <GetSubtitlesFromOpenSubtitlesRestHandler />
          <GetSubtitlesFromFileRestHandler />
        </SwaggerServer>
      </Database>
    </>
  );
}
