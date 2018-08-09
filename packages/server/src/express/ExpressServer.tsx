import * as React from "react";
import { State, Lifecycle } from "@react-atoms/core";
import * as express from "express";
import { ReactNode } from "react";
import { createServer } from "http";
import * as cors from "cors";

export const ExpressServerContext = React.createContext<{
  app: express.Express;
}>(undefined);

export function ExpressServer(props: { port: number; children: ReactNode }) {
  return (
    <State
      initialState={{
        app: express()
      }}
    >
      {({ state }) => (
        <Lifecycle
          onDidMount={() => {
            state.app.use(cors());
            createServer(state.app).listen(props.port);
          }}
        >
          <ExpressServerContext.Provider value={{ app: state.app }}>
            {props.children}
          </ExpressServerContext.Provider>
        </Lifecycle>
      )}
    </State>
  );
}
