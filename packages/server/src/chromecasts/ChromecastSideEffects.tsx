import * as React from "react";
import { State, Lifecycle } from "@react-atoms/core";
import { ChromecastAddress } from "./ChromecastAddress";
import { Client, DefaultMediaReceiver } from "castv2-client";
import * as mime from "mime";

export type PlayVideo = (
  title,
  videoLink: string,
  subtitlesLink: string
) => void;

export const ChromecastSideEffectsContext = React.createContext<{
  showApplication();
  playVideo: PlayVideo;
}>(undefined);

export class HomeyCastApp extends DefaultMediaReceiver {
  static APP_ID = "7D2728B5";
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
                  onDidMount={() => {
                    const client = new Client();
                    client.connect(
                      address,
                      () => {
                        setState({ client });
                      }
                    );
                    client.on("error", function(err) {
                      console.log("Error: %s", err.message);
                      client.close();
                    });
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
