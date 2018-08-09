import * as React from "react";
import { State } from "@react-atoms/core";
import { Torrent } from "webtorrent";
import { AddressInfo, Server } from "net";

export type StartTorrentStreamServer = (torrent: Torrent) => Promise<number>;

export const StreamingServerSideEffectsContext = React.createContext<{
  startTorrentStreamServer: StartTorrentStreamServer;
}>(undefined);

export function StreamingServerSideEffects(props: {
  children: React.ReactNode;
}) {
  return (
    <State<{ runningServer: Server }>
      initialState={{
        runningServer: undefined
      }}
    >
      {({ state, setState }) => (
        <StreamingServerSideEffectsContext.Provider
          value={{
            async startTorrentStreamServer(torrent) {
              if (state.runningServer) {
                console.log("A server is alredy running. Closing...");
                state.runningServer.close();
              }

              await waitForInfoHash(torrent);

              console.log("Got torrent infoHas, creating server...");

              const server = await createTorrentServer(torrent);
              setState({
                runningServer: server
              });

              await waitForTorrentReady(torrent);

              return (server.address() as AddressInfo).port;
            }
          }}
        >
          {props.children}
        </StreamingServerSideEffectsContext.Provider>
      )}
    </State>
  );
}

export async function waitForInfoHash(torrent: Torrent) {
  return new Promise(resolve => {
    if (torrent.infoHash) resolve();
    else torrent.on("infoHash", resolve);
  });
}

export async function createTorrentServer(torrent: Torrent): Promise<Server> {
  return new Promise<Server>(resolve => {
    const server = torrent.createServer();
    server.on("error", err => {
      console.log(err);
    });

    server.listen(0, () => {
      console.log("server started on ", server.address());
      resolve(server);
    });
  });
}

export async function waitForTorrentReady(torrent: Torrent) {
  return new Promise(resolve => {
    if (torrent.ready) resolve();
    else torrent.once("ready", resolve);
  });
}
