import * as React from "react";
import * as ChromecastClient from "chromecasts";
import { State, Lifecycle, Interval } from "@react-atoms/core";
import { Chromecast } from "./Chromecast";

export function ChromecastsMonitor(props: {
  monitorInterval?: number;
  onNewChromecastDiscovered(chromecast: Chromecast);
}) {
  return (
    <State
      initialState={{
        chromecastClient: undefined
      }}
    >
      {({ state, setState }) => (
        <Lifecycle
          onDidMount={() => {
            const chromecastClient = ChromecastClient();

            setState({
              chromecastClient
            });

            console.log("Starting to monitor for chromecasts...");
            chromecastClient.on("update", async player => {
              player.on("error", err => {
                err.message = "Chromecast: " + err.message;
                console.log(err);
              });

              player.on("Status", status => {
                console.log("Chromecast status", status);
              });

              props.onNewChromecastDiscovered(player);
            });
          }}
        >
          {state.chromecastClient && (
            <Interval
              interval={props.monitorInterval || 5000}
              run={() => {
                state.chromecastClient.update();
              }}
            />
          )}
        </Lifecycle>
      )}
    </State>
  );
}
