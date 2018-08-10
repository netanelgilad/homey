export type TVShowEpisode = {
  tvShowName: string;
  season: number;
  episode: number;
  coverImageUrl: string;
  magnetLink: string;
  filePath?: string;
};

export function canonizeTVShowName(name: string): string {
  let tvShow = name;
  if (tvShow.startsWith("of ") || tvShow.startsWith(" of ")) {
    tvShow = tvShow.replace("of", "");
  }

  tvShow = tvShow.replace(" ' ", "");
  tvShow = tvShow.replace("'", "");
  tvShow = tvShow.replace(/ \w /, " ");
  tvShow = tvShow.replace("-", " ");
  tvShow = tvShow.replace(/ +(?= )/g, "");

  return tvShow;
}
