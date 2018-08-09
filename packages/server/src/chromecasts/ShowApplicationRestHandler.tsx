import * as React from "react";
import { RestAction } from "../rest-actions/RestAction";
import { RestActionHandler } from "../rest-actions/RestActionHandler";

export const showApplicationRestAction: RestAction<{}, void> = {
  path: "/application/show",
  method: "post",
  parameters: {}
};

export function ShowApplicationRestHandler(props: { onShowApplication() }) {
  return (
    <RestActionHandler
      restAction={showApplicationRestAction}
      handler={() => {
        props.onShowApplication();
      }}
    />
  );
}
