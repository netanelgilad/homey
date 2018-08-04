import * as React from "react";
import { RestAction } from "./RestAction";
import { Lifecycle, State } from "@react-atoms/core";
import { RestRouteRegistrarContext } from "./RestRouteRegistrarContext";

export type RestActionHandlerFunction<
  TParams extends {} = any,
  TResult = any
> = (params: TParams) => Promise<TResult> | TResult;

export type RestActionHandlerType<TParams extends {} = any, TResult = any> = {
  restAction: RestAction<TParams, TResult>;
  handler: RestActionHandlerFunction<TParams, TResult>;
};

export function RestActionHandler<TParams, TResult>(
  props: RestActionHandlerType<TParams, TResult> & {
    children?: React.ReactNode;
  }
) {
  return (
    <RestRouteRegistrarContext.Consumer>
      {({ registerRoute, updateRouteHandler }) => (
        <State
          initialState={{
            routeId: undefined
          }}
        >
          {({ state, setState }) => (
            <Lifecycle<{handler: RestActionHandlerFunction}>
              handler={props.handler}
              onDidMount={() => {
                const routeId = registerRoute({
                  restAction: props.restAction,
                  handler: props.handler
                });
                setState({
                  routeId
                });
              }}
              onDidUpdate={(prevProps, __) => {
                if (props.handler !== prevProps.handler) {
                  updateRouteHandler(state.routeId, props.handler);
                }
              }}
            >
              {props.children || null}
            </Lifecycle>
          )}
        </State>
      )}
    </RestRouteRegistrarContext.Consumer>
  );
}
