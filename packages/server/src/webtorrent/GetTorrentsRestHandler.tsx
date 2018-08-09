import * as React from "react";
import { RestAction } from "../rest-actions/RestAction";
import { Torrent } from "./Torrent";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { Instance } from "webtorrent";

export const getTorrentsRestAction: RestAction<{}, Array<Torrent>> = {
  path: "/torrents",
  method: "get",
  parameters: {}
};

export function GetTorrentsRestHandler(props: { client: Instance }) {
  return (
    <RestActionHandler
      restAction={getTorrentsRestAction}
      handler={() =>
        props.client.torrents.map(torrent => ({
          name: torrent.name,
          progress: torrent.progress,
          downloadSpeed: torrent.downloadSpeed,
          peers: torrent.numPeers,
          timeRemaining: torrent.timeRemaining
        }))
      }
    />
  );
}
