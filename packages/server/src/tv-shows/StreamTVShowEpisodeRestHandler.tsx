import * as React from "react";
import { RestActionHandler } from '../rest-actions/RestActionHandler';
import { streamTVShowEpisodeRestAction } from './streamTVShowEpisodeRestAction';

export function StreamTVShowEpisodeRestHandler() {
    return (
        <RestActionHandler 
            restAction={streamTVShowEpisodeRestAction}
            handler={() => {

            }}
        />
    )
}

