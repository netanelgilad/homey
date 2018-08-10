import * as React from "react";
import { State, Lifecycle } from "@react-atoms/core";
import { ChromecastAddress } from "./ChromecastAddress";
import {
  Client,
  DefaultMediaReceiver,
  RequestResponseController
} from "castv2-client";
import * as mime from "mime";
import { readFileSync } from "fs";

export type PlayVideo = (
  title,
  videoLink: string,
  subtitlesLink: string
) => void;

export type DisplayMessage = (
  type: "error" | "info" | "warning",
  message: string
) => void;

function getAppId() {
  const config = JSON.parse(readFileSync("./config.json", "utf-8"));
  return config.appId;
}

export const ChromecastSideEffectsContext = React.createContext<{
  showApplication();
  playVideo: PlayVideo;
  displayMessage: DisplayMessage;
  isConnected(): boolean;
}>(undefined);

export class HomeyCastApp extends DefaultMediaReceiver {
  static APP_ID = getAppId();
  homeyMessages: RequestResponseController;

  constructor(client, session) {
    super(client, session);

    this.homeyMessages = this.createController(
      RequestResponseController,
      "urn:x-cast:com.homey.messages"
    );
  }

  sendMessage(data: { type: string }) {
    console.log("Sending message of type ", data.type);
    this.homeyMessages.request(data, () => {
      console.log("Message recieved.");
    });
  }
}

export function ChromecastSideEffects(props: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <State
      initialState={{
        client: undefined
      }}
    >
      {({ state, setState }) => (
        <>
          <ChromecastAddress name={props.name}>
            {({ address }) =>
              address && (
                <Lifecycle
                  onDidMount={async () => {
                    getConnectedClient(address, client => setState({ client }));
                  }}
                />
              )
            }
          </ChromecastAddress>
          <ChromecastSideEffectsContext.Provider
            value={{
              showApplication() {
                if (!state.client) {
                  console.log("not connected to chromecast yet..");
                } else {
                  startApplication(state.client);
                }
              },
              async playVideo(title, videoLink, subtitlesLink) {
                if (!state.client) {
                  console.log(
                    "Chromecast not connected yet. Can't play video..."
                  );
                  return;
                }
                const player = await startApplication(state.client);
                const media = {
                  contentId: videoLink,
                  contentType: (mime as any).lookup(videoLink, "video/mp4"),
                  streamType: "BUFFERED",
                  tracks: [subtitlesLink].map(toSubtitles),
                  metadata: {
                    type: 0,
                    metadataType: 0,
                    title: "Homey - " + title,
                    images: []
                  }
                };

                player.load(
                  media,
                  {
                    autoplay: true,
                    currentTime: 0,
                    activeTrackIds: [1]
                  },
                  () => {
                    console.log("Video loaded.");
                  }
                );
              },
              async displayMessage(type, message) {
                if (!state.client) {
                  console.log(
                    "Can't display message, client not connected yet."
                  );
                  return;
                }

                const player = await startApplication(state.client);
                player.sendMessage({
                  type,
                  message
                });
              },
              isConnected() {
                return !!state.client;
              }
            }}
          >
            {props.children}
          </ChromecastSideEffectsContext.Provider>
        </>
      )}
    </State>
  );
}

export function startApplication(client) {
  return new Promise<any>((resolve, reject) => {
    console.log("Getting session on chromecast...");
    client.getSessions(function(err, sess) {
      if (err) {
        console.log("An error occured trying to get sessions", err);
        reject(err);
      }

      var session = sess[0];
      if (session && session.appId === HomeyCastApp.APP_ID) {
        client.join(session, HomeyCastApp, (_err, p) => {
          console.log("Joined session.");
          resolve(p);
        });
      } else {
        client.launch(HomeyCastApp, (_err, p) => {
          console.log("Launched session");
          resolve(p);
        });
      }
    });
  });
}

function toSubtitles(url, i) {
  if (typeof url !== "string") return url;
  return {
    trackId: i + 1,
    type: "TEXT",
    trackContentId: url,
    trackContentType: "text/vtt",
    name: "English",
    language: "en-US",
    subtype: "SUBTITLES"
  };
}

async function getConnectedClient(
  address: string,
  onClientConnected: (client: Client) => void
) {
  const client = new Client();
  client.connect(
    address,
    () => onClientConnected(client)
  );
  client.on("status", status => {
    console.log("client status", status);
  });
  client.on("error", err => {
    console.log("Error: %s", err.message);
    client.close();
    getConnectedClient(address, onClientConnected);
  });
}
