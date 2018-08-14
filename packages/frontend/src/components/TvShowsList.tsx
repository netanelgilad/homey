import { Interval } from "@react-atoms/core";
// import { Col, Row } from "antd/lib/grid";
import Icon from "antd/lib/icon";
import List from "antd/lib/list";
import Progress from "antd/lib/progress";
import Tag from "antd/lib/tag";
import * as React from "react";
import { APIAction } from "../network/APIAction";
import Card from "antd/lib/card";

export const KiloByte = 1024;
export const MegaByte = 1024 * 1024;
export const GigaByte = MegaByte * 1024;

export const Second = 1000;
export const Minute = 1000 * 60;
export const Hour = Minute * 60;

const IconText = ({ type, text }) => (
  <span>
    <Icon type={type} style={{ marginRight: 8 }} />
    {text}
  </span>
);

export function Speed(props: { speed: number }) {
  let speed = props.speed.toFixed(2) + "B/s";

  if (props.speed > MegaByte * 1.1) {
    speed = (props.speed / MegaByte).toFixed(2) + "MB/s";
  } else if (props.speed > KiloByte * 1.1) {
    speed = (props.speed / KiloByte).toFixed(2) + "KB/s";
  }

  return <span>{speed}</span>;
}

export function Time(props: { time: number }) {
  if (!props.time) {
    return <span>∞️</span>;
  }

  let time =
    (props.time / Hour).toFixed(0) +
    "h" +
    ((props.time % Hour) / Minute).toFixed(0) +
    "m";
  if (props.time < Second) {
    time = props.time.toFixed(0) + "ms";
  } else if (props.time < Minute) {
    time = (props.time / Second).toFixed(0) + "s";
  } else if (props.time < Hour) {
    time = (props.time / Minute).toFixed(0) + "m";
  }

  return <span>{time}</span>;
}

export const gridStyle = {
  textAlign: "center" as "center",
  padding: "0",
  marginBottom: "3px"
};

export function TvShowsList(props: { poll: boolean }) {
  return (
    <APIAction
      initialValue={[] as any[]}
      activate={axios => axios.get("/tv-shows")}
    >
      {({ isInProgress, didExecute, value, call }) => (
        <>
          <Card
            title="Active downloads"
            headStyle={{ padding: "5px" }}
            bodyStyle={{ padding: "5px" }}
          >
            <List
              itemLayout="horizontal"
              loading={isInProgress && !didExecute}
              grid={{ gutter: 16 }}
              dataSource={(value || []).filter(x => !x.episode.done)}
              renderItem={(tvShowEpisodeInfo: any) => (
                <List.Item
                  style={{ marginBottom: "2px" }}
                  actions={
                    tvShowEpisodeInfo.torrentInfo.progress === 1
                      ? []
                      : [
                          <Progress
                            type="circle"
                            status="active"
                            width={40}
                            percent={Math.round(
                              tvShowEpisodeInfo.torrentInfo.progress * 100
                            )}
                          />,
                          <IconText
                            type="cloud-download"
                            text={
                              <Speed
                                speed={
                                  tvShowEpisodeInfo.torrentInfo.downloadSpeed
                                }
                              />
                            }
                          />,
                          <IconText
                            type="clock-circle"
                            text={
                              <Time
                                time={
                                  tvShowEpisodeInfo.torrentInfo.timeRemaining
                                }
                              />
                            }
                          />,
                          <IconText
                            type="usergroup-add"
                            text={tvShowEpisodeInfo.torrentInfo.peers}
                          />
                        ]
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <img
                        height={70}
                        src={tvShowEpisodeInfo.episode.coverImageUrl}
                      />
                    }
                    title={tvShowEpisodeInfo.episode.tvShowName}
                    description={
                      <div>
                        <div style={{ fontSize: "10px" }}>
                          Season {tvShowEpisodeInfo.episode.season} Episode{" "}
                          {tvShowEpisodeInfo.episode.episode}
                        </div>
                        <div>
                          {tvShowEpisodeInfo.episode.subtitlesUrl ? (
                            <Tag color="green">Has Subtitles</Tag>
                          ) : (
                            <Tag color="orange">No Subtitles</Tag>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
          <Card
            title="Ready To Stream"
            headStyle={{ padding: "5px" }}
            bodyStyle={{ padding: "5px" }}
          >
            {value!
              .filter(x => x.episode.done)
              .map(x => x.episode)
              .map(episode => (
                <Card.Grid style={gridStyle}>
                  <div style={{display: "flex"}}>
                    <div style={{  }}>
                      <img height={70} src={episode.coverImageUrl} />
                    </div>
                    <div style={{ flex: 1}}>
                      <h4>{episode.tvShowName}</h4>
                      <div style={{ fontSize: "10px" }}>
                          Season {episode.season} Episode{" "}
                          {episode.episode}
                        </div>
                        <div>
                          {episode.subtitlesUrl ? (
                            <Tag color="green">Has Subtitles</Tag>
                          ) : (
                            <Tag color="orange">No Subtitles</Tag>
                          )}
                        </div>
                    </div>
                  </div>
                </Card.Grid>
              ))}
          </Card>
          {props.poll && <Interval interval={1500} run={call} />}
        </>
      )}
    </APIAction>
  );
}
