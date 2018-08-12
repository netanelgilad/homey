import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { Instance, Torrent } from "webtorrent";
import { LowCollection } from "../database/Collection";
import { TVShowEpisode } from "../tv-shows/TVShow";
import { forEach } from "lodash";

export function PauseTorrentRestHandler(props: {
  client: Instance;
  downloadsCollection: LowCollection<TVShowEpisode>;
}) {
  return (
    <RestActionHandler
      restAction={{
        path: "/downloads/pause",
        method: "post",
        parameters: {}
      }}
      handler={() => {
        const activeDownloads = props.downloadsCollection
          .filter(x => !x.done)
          .value();
        forEach(activeDownloads, download => {
          (props.client.get(download.magnetLink) as Torrent).pause();
        });
      }}
    />
  );
}
