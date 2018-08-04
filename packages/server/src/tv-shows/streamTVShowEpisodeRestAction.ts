import { RestAction, RestParameterLocation } from '../rest-actions/RestAction';

export const streamTVShowEpisodeRestAction: RestAction<{
    tvShow: string;
    season?: number;
    episode?: number;
}, void> = {
    path: "/tv-shows/stream",
    method: "post",
    parameters: {
        tvShow: {
            location: RestParameterLocation.FormData,
            required: true
        },
        season: {
            location: RestParameterLocation.FormData
        },
        episode: {
            location: RestParameterLocation.FormData
        }
    }
}