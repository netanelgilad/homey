import * as React from "react";
import { DatabaseContext } from "./Database";
import { Renderable, Lifecycle } from "@react-atoms/core";
import { LoDashExplicitSyncWrapper } from "lowdb";

export type LowCollection<T> = LoDashExplicitSyncWrapper<Array<T>>;

export function Collection<T>(props: {
  name: string;
  children: Renderable<{ collection: LowCollection<T> }>;
}) {
  return (
    <DatabaseContext.Consumer>
      {({ db }) => (
        <Lifecycle
          onDidCreate={() => db.defaults({ [props.name]: [] }).write()}
        >
          {props.children({
            collection: db.get(props.name) as LoDashExplicitSyncWrapper<
              Array<T>
            >
          })}
        </Lifecycle>
      )}
    </DatabaseContext.Consumer>
  );
}
