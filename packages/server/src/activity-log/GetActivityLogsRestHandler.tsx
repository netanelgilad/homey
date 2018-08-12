import * as React from "react";
import { ActivityLogsSideEffectsContext } from "./ActivityLogsSideEffects";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { RestParameterLocation } from "../rest-actions/RestAction";

export function GetActivityLogsRestHandler() {
  return (
    <ActivityLogsSideEffectsContext.Consumer>
      {({ getActivityLog }) => (
        <RestActionHandler
          restAction={{
            path: "/activity-log",
            method: "get",
            parameters: {
              limit: {
                location: RestParameterLocation.Query
              }
            }
          }}
          handler={({ limit }: { limit: number }) => getActivityLog(limit)}
        />
      )}
    </ActivityLogsSideEffectsContext.Consumer>
  );
}
