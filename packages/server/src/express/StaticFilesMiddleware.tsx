import * as React from "react";
import { ExpressServerContext } from "./ExpressServer";
import { Lifecycle } from "@react-atoms/core";
import { static as staticMiddleware } from "express";

export function StaticFilesMiddleware(props: {
  prefix?: string | RegExp | Array<string | RegExp>;
  path: string;
}) {
  return (
    <ExpressServerContext.Consumer>
      {({ app }) => (
        <Lifecycle
          onDidMount={() => {
            // ugly hack because of swagger
            setTimeout(() => {
              if (props.prefix) {
                app.use(props.prefix, staticMiddleware(props.path));
              } else {
                app.use(staticMiddleware(props.path));
              }
            }, 3000);
          }}
        />
      )}
    </ExpressServerContext.Consumer>
  );
}
