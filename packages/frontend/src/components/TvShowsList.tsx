import { Interval } from "@react-atoms/core";
// import { Col, Row } from "antd/lib/grid";
import Icon from "antd/lib/icon";
import List from "antd/lib/list";
import Progress from "antd/lib/progress";
import Tag from "antd/lib/tag";
import * as React from "react";
import { APIAction } from "../network/APIAction";

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
  width: "25%"
};

export function TvShowsList(props: {
  poll: boolean;
}) {
  return (
    <APIAction
      initialValue={[] as any[]}
      activate={axios => axios.get("/tv-shows")}
    >
      {({ isInProgress, didExecute, value, call }) => (
        <>
          <List
            itemLayout="horizontal"
            loading={isInProgress && !didExecute}
            grid={{ gutter: 16 }}
            dataSource={value || []}
            renderItem={(tvShowEpisodeInfo: any) => (
              <List.Item
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
                              time={tvShowEpisodeInfo.torrentInfo.timeRemaining}
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
                      height={100}
                      src={tvShowEpisodeInfo.episode.coverImageUrl}
                    />
                  }
                  title={tvShowEpisodeInfo.episode.tvShowName}
                  description={
                    <div>
                      <div>
                        Season {tvShowEpisodeInfo.episode.season} Episode{" "}
                        {tvShowEpisodeInfo.episode.episode}
                      </div>
                      <div>
                        <div>
                          {tvShowEpisodeInfo.torrentInfo.progress > 0.1 ? (
                            <Tag color="green">Ready to stream</Tag>
                          ) : (
                            <Tag color="orange">Waiting...</Tag>
                          )}
                        </div>
                        <div>
                          {tvShowEpisodeInfo.torrentInfo.progress === 1 ? (
                            <Tag color="green">Download Complete</Tag>
                          ) : (
                            <Tag color="orange">Downloading...</Tag>
                          )}
                        </div>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          {
            props.poll && <Interval interval={1500} run={call} />
          }
        </>
      )}
    </APIAction>
  );
}
