import * as low from "lowdb";
import * as FileSync from "lowdb/adapters/FileSync";
import { TVShowEpisode } from "./TVShow";

const adapter = FileSync('tv-shows-db.json')
const db = low(adapter);

const downloadedTvShowsEpisodes = "downloadedTvShowsEpisodes";

db.defaults({ [downloadedTvShowsEpisodes]: [] }).write;

export function saveDownloadedTvShowEpisode(tvShowEpisode: TVShowEpisode) {
    db.get(downloadedTvShowsEpisodes)
        .push(tvShowEpisode)
        .write();
}

export function getDownloadedTvShowEpisode(tvShowName: string, season: number, episode: number) {
    return db.get(downloadedTvShowsEpisodes)
        .find({
            tvShowName,
            season,
            episode
        })
        .value();
}