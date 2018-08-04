import * as React from "react";
import * as BroadlinkJS from "broadlinkjs-rm";
import { State, Lifecycle, Interval } from "@react-atoms/core";
import { Device } from "./Device";

export function BroadlinkDevicesMonitor(props: {
  monitorInterval?: number;
  onNewDeviceDetected(device: Device);
}) {
  return (
    <State
      initialState={{
        broadlink: undefined
      }}
    >
      {({ state, setState }) => (
        <Lifecycle
          onDidMount={() => {
            const broadlink = new BroadlinkJS();

            setState({
              broadlink
            });

            console.log("Starting to monitor for broadlink devices...");
            broadlink.discover();

            broadlink.on("deviceReady", device => {
              const macAddressParts =
                device.mac.toString("hex").match(/[\s\S]{1,2}/g) || [];
              const macAddress = macAddressParts.join(":");
              device.host.macAddress = macAddress;

              props.onNewDeviceDetected({
                host: device.host,
                model: device.model,
                sendData: device.sendData.bind(device)
              });
            });
          }}
          onWillUnmount={() => {
            console.log("Stopped monitoring for broadlink devices...");
          }}
        >
          {state.broadlink ? (
            <Interval
              interval={props.monitorInterval || 5000}
              run={() => {
                state.broadlink.discover();
              }}
            />
          ) : null}
        </Lifecycle>
      )}
    </State>
  );
}
