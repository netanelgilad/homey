import * as React from "react";
declare const cast: any;

export class CastMediaPlayer extends React.Component<
  {
    onVideoPlaying();
    onVideoStopped();
    onDisplayMessage(event: {type: "error" | "info", message: string});
  },
  {
    failedLoadingPlayer: boolean;
  }
> {
  private ref: React.RefObject<HTMLDivElement>;

  constructor(
    props
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
        const context = cast.framework.CastReceiverContext.getInstance();
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
          }
        );

        context.addCustomMessageListener("urn:x-cast:com.homey.messages", (customEvent) => {
          this.props.onDisplayMessage(customEvent.data);
        });
        
        context.start();

    }
    catch (err) {
        this.setState({ failedLoadingPlayer : true });
    }
    
  }
}
