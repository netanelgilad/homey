import { RestActionHandler } from "../rest-actions/RestActionHandler";
import React = require("react");
import { emitCommandRestAction } from "./emitCommandRestAction";
import { AllDeviceCommands } from "./AllDeviceCommands";
import { RemoteSideEffectsContext } from "./RemoteSideEffects";

export function EmitCommandRestHandler() {
  return (
    <RemoteSideEffectsContext.Consumer>
      {({ emitRemoteData }) => (
        <RestActionHandler
          restAction={emitCommandRestAction}
          handler={({ name }) => {
            const deviceCommand = AllDeviceCommands.get(name);
            if (!deviceCommand) {
              throw new Error(`No device command found for ${name}`);
            }

            console.log("emitting command ", name);
            emitRemoteData(deviceCommand.data);
          }}
        />
      )}
    </RemoteSideEffectsContext.Consumer>
  );
}
