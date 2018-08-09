import { safeGet } from "../utils";

export type Episode = {
  season: number;
  number: number;
};

export type TVShowInfo = {
  tvShowName: string;
  coverImageUrl: string;
  episodes: Array<Episode>;
  previousEpisode: Episode;
};

export async function getTVShowInfo(tvShow): Promise<TVShowInfo> {
  console.log("Getting tv show info from TV Maze for tv show", tvShow);
  const showInfo = await safeGet(
    `http://api.tvmaze.com/singlesearch/shows?q=${tvShow}&embed[]=episodes&embed[]=previousepisode`
  );
  return {
    tvShowName: showInfo.name,
    coverImageUrl: showInfo.image.medium,
    episodes: showInfo._embedded.episodes,
    previousEpisode: showInfo._embedded.previousEpisode
  };
}
