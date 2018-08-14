import * as React from "react";
import { DatabaseContext } from "./Database";
import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { ComponentLogger } from "../activity-log/ComponentLogger";
import * as rimraf from "rimraf";

export function ClearDatabaseRestHandler() {
  return (
    <ComponentLogger name="Database">
      {({ log }) => (
        <DatabaseContext.Consumer>
          {({ db }) => (
            <RestActionHandler
              restAction={{
                path: "/database/clear",
                method: "post",
                parameters: {}
              }}
              handler={async () => {
                log({
                  level: "info",
                  message: "Got request to clear database..."
                });
                db.setState({}).write();
                await new Promise((resolve, reject) => {
                  rimraf("./torrents", err => {
                    if (err) reject(err);
                    else resolve();
                  });
                });
                log({
                  level: "info",
                  message: "Database cleared and torrents removed."
                });
              }}
            />
          )}
        </DatabaseContext.Consumer>
      )}
    </ComponentLogger>
  );
}
