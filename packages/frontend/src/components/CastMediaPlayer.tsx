import * as React from "react";
declare const cast: any;

export class CastMediaPlayer extends React.Component<
  {
    onVideoPlaying();
    onVideoStopped();
  },
  {
    failedLoadingPlayer: boolean;
  }
> {
  private ref: React.RefObject<HTMLDivElement>;

  constructor(
    props: Readonly<{ onVideoPlaying(): any; onVideoStopped(): any }>
  ) {
    super(props);

    this.ref = React.createRef();
    this.state = {
        failedLoadingPlayer: false
    };
  }

  public render() {
      if (!this.state.failedLoadingPlayer) {
        return (
            <div style={{ position: "relative", height: "100%" }} ref={this.ref} />
          );
      }
      else {
          return (
            <div style={{ position: "relative", height: "100%", background: "black" }}>
                <h5 style={{color: "white"}}>This is where the player appears</h5>
            </div>
          )
      }
  }

  public componentDidMount() {
    this.ref.current!.innerHTML = "<cast-media-player></cast-media-player>";
    try {
        cast.framework.CastReceiverContext.getInstance().start();
        const playerManager = cast.framework.CastReceiverContext.getInstance().getPlayerManager();
        let playing = false;
    
        playerManager.addEventListener(
          cast.framework.events.EventType.MEDIA_STATUS,
          (event: any) => {
            console.log(event);
            if (!playing && event.mediaStatus.playerState === "PLAYING") {
              playing = true;
              this.props.onVideoPlaying();
            } else if (playing && event.mediaStatus.playerState === "PAUSED") {
              playing = false;
              this.props.onVideoStopped();
            }
            // Write your own event handling code, for example
            // using the event.mediaStatus value
          }
        );
    }
    catch (err) {
        this.setState({ failedLoadingPlayer : true });
    }
    
  }
}
