import { RestActionHandler } from "../rest-actions/RestActionHandler";
import React = require("react");
import { emitCommandRestAction } from "./emitCommandRestAction";
import { Device } from "./Device";
import { AllDeviceCommands } from "./AllDeviceCommands";
import { emitCommand } from "./runCommand";

export function EmitCommandRestHandler(props: { activeDevice: Device }) {
  return (
    <RestActionHandler
      restAction={emitCommandRestAction}
      handler={({ name }) => {
        const deviceCommand = AllDeviceCommands.get(name);
        if (!deviceCommand) {
          throw new Error(`No device command found for ${name}`);
        }

        console.log("emitting command ", name);
        emitCommand(props.activeDevice, deviceCommand);
      }}
    />
  );
}
