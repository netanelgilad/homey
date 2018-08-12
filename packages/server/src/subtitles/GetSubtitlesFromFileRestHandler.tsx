import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { getSubtitlesFromFileRestAction } from "./getSubtitlesFromFileRestAction";
import { createReadStream } from "fs";
import React = require("react");

export function GetSubtitlesFromFileRestHandler() {
  return (
    <RestActionHandler
      restAction={getSubtitlesFromFileRestAction}
      handler={({ filePath }) => {
        console.log("got request for subtitles");

        return createReadStream(filePath);
      }}
    />
  );
}
