import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { cpuUsage as getCPUUsage, freemem } from "os-utils";
import { RemoteSideEffectsContext } from "../devices/RemoteSideEffects";
import { ChromecastSideEffectsContext } from "../chromecasts/ChromecastSideEffects";

export function GetServerStatsRestHandler() {
  return (
    <ChromecastSideEffectsContext.Consumer>
      {({ isConnected }) => (
        <RemoteSideEffectsContext.Consumer>
          {({ hasDetectedDevice }) => (
            <RestActionHandler
              restAction={{
                path: "/server/stats",
                method: "get",
                parameters: {}
              }}
              handler={async () => {
                const cpuUsage = await new Promise<any>(resolve => {
                  getCPUUsage(cpuUsage => {
                    resolve(cpuUsage);
                  });
                });

                const freeMemory = freemem();

                const deviceDetected = hasDetectedDevice();

                const chromecastConnected = isConnected();

                return {
                  cpuUsage,
                  freeMemory,
                  deviceDetected,
                  chromecastConnected
                };
              }}
            />
          )}
        </RemoteSideEffectsContext.Consumer>
      )}
    </ChromecastSideEffectsContext.Consumer>
  );
}
