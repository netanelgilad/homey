import * as React from "react";
import { TVShowEpisode } from "./TVShow";
import { RestAction } from "../rest-actions/RestAction";
import { LowCollection } from "../database/Collection";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { Torrent } from "../webtorrent/Torrent";
import { Instance, Torrent as WebTorrentTorrent } from "webtorrent";
import { originalTorrentToTorrent } from "./tv-show-functions";

export const getTVShowsRestAction: RestAction<
  {},
  Array<{ episode: TVShowEpisode; torrentInfo: Torrent }>
> = {
  path: "/tv-shows",
  method: "get",
  parameters: {}
};

export function GetTVShowsRestHandler(props: {
  client: Instance;
  collection: LowCollection<TVShowEpisode>;
}) {
  return (
    <RestActionHandler
      restAction={getTVShowsRestAction}
      handler={() => {
        const tvShows = props.collection.value();
        return tvShows.map(tvShow => {
          if (tvShow.done) {
            return {
              episode: tvShow,
              torrentInfo: {
                progress: 1,
                downloadSpeed: 0,
                name: tvShow.tvShowName,
                peers: 0,
                timeRemaining: 0
              }
            };
          }
          const torrent = props.client.get(
            tvShow.magnetLink
          ) as WebTorrentTorrent;
          return {
            episode: tvShow,
            torrentInfo: originalTorrentToTorrent(torrent)
          };
        });
      }}
    />
  );
}
