import * as React from "react";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { cpuUsage, freemem } from "os-utils";

export function GetServerStatsRestHandler() {
  return (
    <RestActionHandler
      restAction={{
        path: "/server/stats",
        method: "get",
        parameters: {}
      }}
      handler={() => {
        return new Promise<any>(resolve => {
          cpuUsage(cpuUsage => {
            resolve({
              cpuUsage,
              freeMemory: freemem()
            });
          });
        });
      }}
    />
  );
}
