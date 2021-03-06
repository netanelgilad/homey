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
  path: "/subtitles",
  method: "get",
  parameters: {
    filePath: {
      location: RestParameterLocation.Query,
      required: true
    }
  },
  responseType: RestResponseType.Stream
};
