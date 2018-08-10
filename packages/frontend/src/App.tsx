import * as React from "react";
import Layout from "antd/lib/layout";
import message from "antd/lib/message";
import "./App.css";
import { TvShowsList } from "./components/TvShowsList";
import { CastMediaPlayer } from "./components/CastMediaPlayer";
import { State, Interval } from "@react-atoms/core";
import Button from "antd/lib/button";
import { APIAction } from "./network/APIAction";
import Axios from "../node_modules/axios";
import Icon from "antd/lib/icon";

message.config({
  top: 50
});

class App extends React.Component {
  public render() {
    return (
      <State
        initialState={{
          isPlaying: false
        }}
      >
        {({ state, setState }) => (
          <Layout style={{ height: "100%", padding: "50px" }}>
            <Layout>
              <Layout.Sider width={600} theme="light">
                <TvShowsList poll={!state.isPlaying} />
              </Layout.Sider>
              <Layout.Content>
                <div style={{ height: "50px", backgroundColor: "#ffffff" }}>
                  <APIAction<
                    {},
                    {
                      cpuUsage: number;
                      freeMemory: number;
                      deviceDetected: boolean;
                      chromecastConnected: boolean;
                    }
                  >
                    initialValue={{
                      cpuUsage: 0,
                      freeMemory: 0,
                      deviceDetected: false,
                      chromecastConnected: false
                    }}
                    activate={() => Axios.get("/server/stats")}
                  >
                    {({ value, call }) => (
                      <>
                        <Button.Group style={{ float: "right" }}>
                          <Button style={{ height: "50px", width: "130px" }}>
                            <Icon
                              type="chrome"
                              style={
                                value!.chromecastConnected
                                  ? { color: "aqua" }
                                  : { color: "orange" }
                              }
                            />
                            Chromecast
                          </Button>
                          <Button style={{ height: "50px", width: "130px" }}>
                            {value!.deviceDetected ? (
                              <Icon
                                type="check-circle"
                                style={{ color: "aqua" }}
                              />
                            ) : (
                              <Icon
                                type="exclamation-circle"
                                style={{ color: "orange" }}
                              />
                            )}
                            Remote
                          </Button>
                          <Button style={{ height: "50px", width: "130px" }}>
                            <Icon type="dashboard" />
                            {(value!.cpuUsage * 100).toFixed(2)}%
                          </Button>
                          <Button style={{ height: "50px", width: "130px" }}>
                            <Icon type="database" />
                            {value!.freeMemory.toFixed(2)}
                            MB
                          </Button>
                        </Button.Group>
                        {!state.isPlaying && (
                          <Interval interval={1500} run={call} />
                        )}
                      </>
                    )}
                  </APIAction>
                </div>
                <div
                  style={
                    state.isPlaying
                      ? {
                          position: "fixed",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%"
                        }
                      : {
                          height: "100%"
                        }
                  }
                >
                  <CastMediaPlayer
                    onVideoPlaying={() => setState({ isPlaying: true })}
                    onVideoStopped={() => setState({ isPlaying: false })}
                    onDisplayMessage={({ type, message: text }) => {
                      message[type](text);
                    }}
                  />
                </div>
              </Layout.Content>
            </Layout>
          </Layout>
        )}
      </State>
    );
  }
}

export default App;
