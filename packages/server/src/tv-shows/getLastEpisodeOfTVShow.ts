import { safeGet } from "../utils";

export async function getTVShowEpisodes(tvShow: string) {
  console.log("Getting last episode info from TV Maze for tv show", tvShow);
  const showInfo = await safeGet(`http://api.tvmaze.com/singlesearch/shows?q=${tvShow}&embed=episodes`);
  return showInfo._embedded.episodes;
}

export async function getLastEpisodeOfTVShow(tvShow: string) {
  console.log("Getting last episode info from TV Maze for tv show", tvShow);
  const showInfo = await safeGet(
    `http://api.tvmaze.com/singlesearch/shows?q=${tvShow}`
  );
  console.log(
    "Successfully got info of tv show",
    tvShow,
    "returning last episode info..."
  );
  const lastEpisodeInfo = await safeGet(showInfo._links.previousepisode.href);
  return {
    season: lastEpisodeInfo.season,
    episode: lastEpisodeInfo.number
  };
}
