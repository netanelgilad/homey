export type Chromecast = {
  name: string;
  play(
    href: string,
    opts: {
      title: string;
      subtitles: string[];
      autoSubtitles: boolean;
    }
  );
};
