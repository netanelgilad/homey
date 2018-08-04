import { State } from "@react-atoms/core";
import { ReactNode, createContext } from "react";
import React = require("react");
import * as low from "lowdb";
import * as FileSync from "lowdb/adapters/FileSync";

export const DatabaseContext = createContext<{ db: low.LowdbSync<any> }>(
  undefined
);

function createDB(filePath: string) {
  const adapter = new FileSync(filePath);
  return low(adapter);
}

export function Database(props: { filePath: string; children?: ReactNode }) {
  return (
    <State
      initialState={{
        db: createDB(props.filePath)
      }}
    >
      {({ state }) => (
        <DatabaseContext.Provider value={{ db: state.db }}>
          {state.db && props.children}
        </DatabaseContext.Provider>
      )}
    </State>
  );
}
