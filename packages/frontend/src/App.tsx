import * as React from "react";
import Layout from "antd/lib/layout";
import message from "antd/lib/message";
import "./App.css";
import { TvShowsList } from "./components/TvShowsList";
import { CastMediaPlayer } from "./components/CastMediaPlayer";
import { State } from "@react-atoms/core";

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
            <Layout.Sider width={600} theme="light">
              <TvShowsList poll={!state.isPlaying} />
            </Layout.Sider>
            <Layout.Content>
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
        )}
      </State>
    );
  }
}

export default App;
