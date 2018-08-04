import { RestActionHandler } from "../rest-actions/RestActionHandler";
import { getSubtitlesFromFileRestAction } from "./getSubtitlesFromFileRestAction";
import * as srt2vtt from "srt-to-vtt";
import { createReadStream } from 'fs';
import * as utf8 from "utf8";
import { decode } from "base-64";
import React = require('react');

export function GetSubtitlesFromFileRestHandler() {
  return (
    <RestActionHandler
      restAction={getSubtitlesFromFileRestAction}
      handler={({filePath}) => {
        console.log("got request for subtitles/srt");
        filePath = utf8.decode(decode(filePath));

        return createReadStream(filePath).pipe(srt2vtt());
      }}
    />
  );
}
