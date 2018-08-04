import {
  RestAction,
  RestParameterLocation,
  RestResponseType
} from "../rest-actions/RestAction";
import { Readable } from "stream";

export const getSubtitlesFromFileRestAction: RestAction<
  {
    filePath: string;
  },
  Readable
> = {
  path: "/subtitles/srt/{filePath}",
  method: "get",
  parameters: {
    filePath: {
      location: RestParameterLocation.Path,
      required: true
    }
  },
  responseType: RestResponseType.Stream
};
