import { RestAction, RestParameterLocation, RestResponseType } from "../rest-actions/RestAction";
import { Readable } from "stream";

export const getSubtitlesFromOpenSubtitlesRestAction: RestAction<
  {
    season: number;
    episode: number;
    filePath: string;
  },
  Readable
> = {
  path: "/subtitles/{season}/{episode}/{filePath}",
  method: "get",
  parameters: {
    season: {
      location: RestParameterLocation.Path,
      required: true
    },
    episode: {
      location: RestParameterLocation.Path,
      required: true
    },
    filePath: {
      location: RestParameterLocation.Path,
      required: true
    }
  },
  responseType: RestResponseType.Stream
};
