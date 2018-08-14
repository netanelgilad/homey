import * as React from "react";
import Badge from "antd/lib/badge";
import { APIAction } from "../network/APIAction";
import { Interval, Lifecycle } from "@react-atoms/core";
import { format } from "date-fns";
import StayScrolled, { scrolled } from "react-stay-scrolled";

export function ActivityLog(props: { poll: boolean }) {
  return (
    <APIAction
      initialValue={[]}
      activate={axios => axios.get("/activity-log?limit=9")}
    >
      {({ value, call }) => (
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "5px" }}>Activity Log</h3>
          <StayScrolled component="div" style={{overflow: "hidden"}}>
            {value!.map((item: any) => (
              <div style={{ margin: "5px" }}>
                <Message item={item} />
              </div>
            ))}
          </StayScrolled>
          {props.poll && <Interval interval={1500} run={call} />}
        </div>
      )}
    </APIAction>
  );
}

export const Message = scrolled(
  (props: { item: any; stayScrolled(); scrollBottom() }) => {
    return (
      <Lifecycle
        onDidMount={() => {
          props.stayScrolled();
          props.scrollBottom();
        }}
      >
        <Badge
          style={{ fontSize: "10px" }}
          status={props.item.level === "info" ? "default" : props.item.level}
          text={`[${format(new Date(props.item.timestamp), "HH:mm:ss")} ${
            props.item.component
          }]: ${props.item.message}`}
        />
      </Lifecycle>
    );
  }
);
