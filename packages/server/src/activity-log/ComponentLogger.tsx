import * as React from "react";
import {
  ActivityLogsSideEffectsContext,
  ActivityLog
} from "./ActivityLogsSideEffects";
import { Renderable } from "@react-atoms/core";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type Log = (activityLog: Omit<ActivityLog, "component">) => void;

export function ComponentLogger(props: {
  name: string;
  children: Renderable<{
    log: Log;
  }>;
}) {
  return (
    <ActivityLogsSideEffectsContext.Consumer>
      {({ writeActivityLog }) =>
        props.children({
          log(activityLog) {
            writeActivityLog({
              ...activityLog,
              component: props.name
            });
          }
        })
      }
    </ActivityLogsSideEffectsContext.Consumer>
  );
}
