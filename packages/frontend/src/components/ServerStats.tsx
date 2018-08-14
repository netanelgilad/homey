import * as React from "react";
import { APIAction } from "../network/APIAction";
import Axios from "axios";
import Button from "antd/lib/button";
import Icon from "antd/lib/icon";
import { Interval } from "@react-atoms/core";
import { GigaByte, MegaByte, KiloByte } from "./TvShowsList";

export function ServerStats(props: { poll: boolean }) {
  return (
    <APIAction<
      {},
      {
        cpuUsage: number;
        freeMemory: number;
        deviceDetected: boolean;
        chromecastConnected: boolean;
        freeSpace: number;
      }
    >
      initialValue={{
        cpuUsage: 0,
        freeMemory: 0,
        freeSpace: 0,
        deviceDetected: false,
        chromecastConnected: false
      }}
      activate={() => Axios.get("/server/stats")}
    >
      {({ value, call }) => (
        <>
          <Button.Group style={{ float: "right" }}>
            <Button style={{ height: "40px", width: "45px" }}>
              <Icon
                type="chrome"
                style={
                  value!.chromecastConnected
                    ? { color: "aqua" }
                    : { color: "red" }
                }
              />
            </Button>
            <Button style={{ height: "40px", width: "45px" }}>
              <Icon
                type="global"
                style={
                  value!.deviceDetected
                    ? { color: "aqua" }
                    : { color: "red" }
                }
              />
            </Button>
            <Button style={{ height: "40px", width: "110px" }}>
              <Icon type="dashboard" />
              {(value!.cpuUsage * 100).toFixed(2)}%
            </Button>
            <Button style={{ height: "40px", width: "110px" }}>
              <Icon type="database" />
              {Space(value!.freeMemory)}
            </Button>
            <Button style={{ height: "40px", width: "110px" }}>
              <Icon type="file" />
              {Space(value!.freeSpace)}
            </Button>
          </Button.Group>
          {props.poll && <Interval interval={1500} run={call} />}
        </>
      )}
    </APIAction>
  );
}

export function Space(space: number) {
  let result = space.toFixed(2) + "B";

  if (space > GigaByte * 1.1) {
    result = (space / GigaByte).toFixed(2) + "GB";
  } else if (space > MegaByte * 1.1) {
    result = (space / MegaByte).toFixed(2) + "MB";
  } else if (space > KiloByte * 1.1) {
    result = (space / KiloByte).toFixed(2) + "KB";
  }

  return result;
}
