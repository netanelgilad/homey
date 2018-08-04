import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { downloadTVShowRestAction } from "./downloadTVShowRestAction";
import { downloadTVShowEpisode } from "./tv-show-functions";
import { Instance } from "webtorrent";
import { LowCollection } from '../database/Collection';
import { TVShowEpisode } from './TVShow';

export function DownloadTVShowRestHandler(props: {
    client: Instance,
    downloadedTVShowsCollection: LowCollection<TVShowEpisode>,
}) {
  return (
    <RestActionHandler
      restAction={downloadTVShowRestAction}
      handler={async ({ tvShow, season, episode }) => {
        await downloadTVShowEpisode(props.client, props.downloadedTVShowsCollection, tvShow, season, episode);
      }}
    />
  );
}
