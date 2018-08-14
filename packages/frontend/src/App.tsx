import * as React from "react";
import Layout from "antd/lib/layout";
import message from "antd/lib/message";
import "./App.css";
import { TvShowsList } from "./components/TvShowsList";
import { CastMediaPlayer } from "./components/CastMediaPlayer";
import { State } from "@react-atoms/core";
import { ServerStats } from "./components/ServerStats";
import { ActivityLog } from "./components/ActivityLog";

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
            <Layout style={{ maxHeight: "620px" }}>
              <Layout.Sider
                width={600}
                theme="light"
                style={{ overflow: "hidden" }}
              >
                <TvShowsList poll={!state.isPlaying} />
              </Layout.Sider>
              <Layout.Content
                style={{
                  backgroundColor: "white",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{ height: "40px", backgroundColor: "#ffffff" }}>
                  <ServerStats poll={!state.isPlaying} />
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
                          height: "300px"
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
                <ActivityLog poll={!state.isPlaying} />
              </Layout.Content>
            </Layout>
          </Layout>
        )}
      </State>
    );
  }
}

export default App;
