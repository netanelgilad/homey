import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { streamRandomTVShowEpisodeRestAction } from "./streamRandomTVShowEpisodeRestAction";
import { streamRandomTVShowEpisode } from "./tv-show-functions";
import { Instance } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { TVShowEpisode } from "./TVShow";
import { Device } from "../devices/Device";
import { Chromecast } from "../chromecasts/Chromecast";

export function StreamRandomTVShowEpisodeRestHandler(props: {
  client: Instance;
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>;
  activeDevice: Device;
  activeChromecast: Chromecast;
}) {
  return (
    <RestActionHandler
      restAction={streamRandomTVShowEpisodeRestAction}
      handler={({ tvShow }) => {
        streamRandomTVShowEpisode(
          props.client,
          props.downloadedTVShowsCollection,
          props.activeDevice,
          props.activeChromecast,
          tvShow
        );
      }}
    />
  );
}
