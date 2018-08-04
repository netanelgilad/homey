import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { streamTVShowEpisodeRestAction } from "./streamTVShowEpisodeRestAction";
import { streamTVShowEpisode } from "./tv-show-functions";
import { Instance } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { TVShowEpisode } from "./TVShow";
import { Device } from "../devices/Device";
import { Chromecast } from "../chromecasts/Chromecast";

export function StreamTVShowEpisodeRestHandler(props: {
  client: Instance;
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>;
  activeDevice: Device;
  activeChromecast: Chromecast;
}) {
  return (
    <RestActionHandler
      restAction={streamTVShowEpisodeRestAction}
      handler={({ tvShow, season, episode }) => {
        streamTVShowEpisode(
          props.client,
          props.downloadedTVShowsCollection,
          props.activeDevice,
          props.activeChromecast,
          tvShow,
          season,
          episode
        );
      }}
    />
  );
}
