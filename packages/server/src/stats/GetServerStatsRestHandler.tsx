import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { cpuUsage as getCPUUsage, freemem } from "os-utils";
import { RemoteSideEffectsContext } from "../devices/RemoteSideEffects";
import { ChromecastSideEffectsContext } from "../chromecasts/ChromecastSideEffects";
import { check } from "diskusage";

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

                const freeSpace = await new Promise((resolve, reject) => {
                  check("./torrents", (err, result) => {
                    if (err) reject(err);
                    else resolve(result.available);
                  });
                });

                return {
                  cpuUsage,
                  freeMemory,
                  deviceDetected,
                  chromecastConnected,
                  freeSpace
                };
              }}
            />
          )}
        </RemoteSideEffectsContext.Consumer>
      )}
    </ChromecastSideEffectsContext.Consumer>
  );
}
