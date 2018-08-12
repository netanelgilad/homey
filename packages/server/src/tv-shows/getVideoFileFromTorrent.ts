import { Torrent, TorrentFile } from "webtorrent";

export function getVideoFileFromTorrent(torrent: Torrent): TorrentFile {
  const largestFileIndex = torrent.files.indexOf(
    torrent.files.reduce((a, b) => (a.length > b.length ? a : b))
  );

  return torrent.files[largestFileIndex];
}
