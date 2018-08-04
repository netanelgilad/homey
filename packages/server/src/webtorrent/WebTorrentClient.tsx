import * as React from "react";
import * as WebTorrent from "webtorrent";
import { State, Renderable } from "@react-atoms/core";

export function WebTorrentClient(props: {
    children: Renderable<{client: WebTorrent.Instance}>;
}) {
  return (
    <State
      initialState={{
        client: createClient()
      }}
    >
      {({ state }) => props.children({ client: state.client})}
    </State>
  );
}

export function createClient() {
  const client = new WebTorrent({});
  client.on("error", console.log);
  return client;
}
