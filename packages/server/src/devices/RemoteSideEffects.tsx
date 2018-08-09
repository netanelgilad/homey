import * as React from "react";
import { State } from "@react-atoms/core";
import { BroadlinkDevicesMonitor } from "./BroadlinkDevicesMonitor";

export const RemoteSideEffectsContext = React.createContext<{
  emitRemoteData(data: string);
}>(undefined);

export function RemoteSideEffects(props: { children: React.ReactNode }) {
  return (
    <State
      initialState={{
        device: undefined
      }}
    >
      {({ state, setState }) => (
        <>
          <BroadlinkDevicesMonitor
            onNewDeviceDetected={device => setState({ device })}
          />
          <RemoteSideEffectsContext.Provider
            value={{
              emitRemoteData(data) {
                if (state.device) {
                  const hexDataBuffer = new Buffer(data, "hex");
                  state.device.sendData(hexDataBuffer);
                }
              }
            }}
          >
            {props.children}
          </RemoteSideEffectsContext.Provider>
        </>
      )}
    </State>
  );
}
