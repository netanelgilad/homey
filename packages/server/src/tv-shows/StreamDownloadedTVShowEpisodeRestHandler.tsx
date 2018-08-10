import * as React from "react";
import { LowCollection } from "../database/Collection";
import { TVShowEpisode } from "./TVShow";
import { ExpressServerContext } from "../express/ExpressServer";
import { Lifecycle } from "../../node_modules/@react-atoms/core";
import mime = require("mime");
import { basename } from "path";
import { statSync, createReadStream } from "fs";
import * as rangeParser from "range-parser";
import * as pump from "pump";
import { Ranges, Range } from "range-parser";

export function StreamDownloadedTVShowEpisodeRestHandler(props: {
  downloadedTVShowsCollection: LowCollection<TVShowEpisode>;
}) {
  return (
    <ExpressServerContext.Consumer>
      {({ app }) => (
        <Lifecycle
          onDidMount={() => {
            app.get(
              "/tv-shows/stream/downloaded/:tvShow/:season/:episode",
              (req, res) => {
                const {
                  tvShow,
                  season,
                  episode
                }: {
                  tvShow: string;
                  season: number;
                  episode: number;
                } = req.params;
                const downloadedTvShow = props.downloadedTVShowsCollection
                  .find({
                    tvShowName: tvShow,
                    season: Number(season),
                    episode: Number(episode)
                  })
                  .value();

                const filePath = downloadedTvShow.filePath;
                const fileInfo = statSync(filePath);
                res.statusCode = 200;
                res.setHeader("Content-Type", mime.getType(basename(filePath)));
                res.setHeader("Accept-Ranges", "bytes");
                res.setHeader(
                  "Content-Disposition",
                  "inline; filename*=UTF-8''" +
                    encodeRFC5987(basename(filePath))
                );

                res.setHeader("transferMode.dlna.org", "Streaming");
                res.setHeader(
                  "contentFeatures.dlna.org",
                  "DLNA.ORG_OP=01;DLNA.ORG_CI=0;DLNA.ORG_FLAGS=01700000000000000000000000000000"
                );

                let range = rangeParser(
                  fileInfo.size,
                  (req.headers.range as string) || ""
                ) as Range | Ranges;

                if (Array.isArray(range)) {
                  res.statusCode = 206; // indicates that range-request was understood

                  // no support for multi-range request, just use the first range
                  range = range[0] as Range;

                  res.setHeader(
                    "Content-Range",
                    "bytes " +
                      range.start +
                      "-" +
                      range.end +
                      "/" +
                      fileInfo.size
                  );
                  res.setHeader("Content-Length", range.end - range.start + 1);
                } else {
                  range = null;
                  res.setHeader("Content-Length", fileInfo.size);
                }

                if (req.method === "HEAD") {
                  return res.end();
                }

                pump(createReadStream(filePath, range as Range), res);
              }
            );
          }}
        />
      )}
    </ExpressServerContext.Consumer>
  );
}

function encodeRFC5987(str) {
  return (
    encodeURIComponent(str)
      // Note that although RFC3986 reserves "!", RFC5987 does not,
      // so we do not need to escape it
      .replace(/['()]/g, escape) // i.e., %27 %28 %29
      .replace(/\*/g, "%2A")
      // The following are not required for percent-encoding per RFC5987,
      // so we can allow for a little better readability over the wire: |`^
      .replace(/%(?:7C|60|5E)/g, unescape)
  );
}
