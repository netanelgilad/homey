import * as React from "react";
import Badge from "antd/lib/badge";
import { APIAction } from "../network/APIAction";
import { Interval } from "@react-atoms/core";
import {format} from 'date-fns';

export function ActivityLog(props: { poll: boolean }) {
  return (
    <APIAction
      initialValue={[]}
      activate={axios => axios.get("/activity-log?limit=10")}
    >
      {({ value, call }) => (
        <>
          <h3 style={{ margin: "5px" }}>Activity Log</h3>
          {value!.map((item: any) => (
            <div style={{ margin: "5px" }}>
              <Badge
                style={{fontSize: "10px"}}
                status={item.level === "info" ? "default" : item.level}
                text={`[${format(new Date(item.timestamp), "HH:mm:ss")} ${item.component}]: ${item.message}`}
              />
            </div>
          ))}
          {props.poll && <Interval interval={1500} run={call} />}
        </>
      )}
    </APIAction>
  );
}
