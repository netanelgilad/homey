import * as React from "react";
import { Collection } from "../database/Collection";

export type ActivityLog = {
  level: "info" | "success" | "warning" | "error";
  component: string;
  message: string;
};

export type WriteActivityLog = (log: ActivityLog) => void;

export type GetActivityLog = (limit?: number) => Array<ActivityLog>;

export const ActivityLogsSideEffectsContext = React.createContext<{
  writeActivityLog: WriteActivityLog;
  getActivityLog: GetActivityLog;
}>(undefined);

export function ActivityLogsSideEffects(props: {
  maxSize: number;
  children: React.ReactNode;
}) {
  return (
    <Collection<ActivityLog & { timestamp: Date }> name="activity-logs">
      {({ collection }) => (
        <ActivityLogsSideEffectsContext.Provider
          value={{
            writeActivityLog(log) {
              const timestamp = new Date();
              if (log.level === "warning") {
                console.warn(`[${timestamp} ${log.component}]: ${log.message}`);
              } else if (log.level === "error") {
                console.error(
                  `[${timestamp} ${log.component}]: ${log.message}`
                );
              } else {
                console.info(`[${timestamp} ${log.component}]: ${log.message}`);
              }

              collection.push({ ...log, timestamp }).write();
              if (collection.size().value() > props.maxSize) {
                collection.shift().write();
              }
            },
            getActivityLog(limit) {
              return collection.takeRight(limit).value();
            }
          }}
        >
          {props.children}
        </ActivityLogsSideEffectsContext.Provider>
      )}
    </Collection>
  );
}
