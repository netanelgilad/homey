import * as React from "react";
import Layout from "antd/lib/layout";
import "./App.css";
import { TvShowsList } from "./components/TvShowsList";
import { CastMediaPlayer } from "./components/CastMediaPlayer";
import { State } from "@react-atoms/core";

class App extends React.Component {
  public render() {
    return (
      <Layout style={{ height: "100%", padding: "50px" }}>
        <Layout.Sider width={600} theme="light">
          <TvShowsList />
        </Layout.Sider>
        <Layout.Content>
          <State
            initialState={{
              isPlaying: false
            }}
          >
            {({state, setState}) => (
              <div
                style={state.isPlaying ? {
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%"
                } : {
                  height: "100%"
                }}
              >
                <CastMediaPlayer 
                  onVideoPlaying={() => setState({isPlaying: true})}
                  onVideoStopped={() => setState({isPlaying: false})}
                />
              </div>
            )}
          </State>
          
        </Layout.Content>
      </Layout>
    );
  }
}

export default App;
