import { RestAction, RestParameterLocation } from "../rest-actions/RestAction";

export const streamRandomTVShowEpisodeRestAction: RestAction<
  {
    tvShow: string;
  },
  void
> = {
  path: "/tv-shows/stream/random",
  method: "post",
  parameters: {
    tvShow: {
      location: RestParameterLocation.FormData,
      required: true
    }
  }
};
