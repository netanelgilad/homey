import { Lifecycle, Renderable, State } from "@react-atoms/core";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import * as React from "react";

export function APIAction<TParams, TResult>(props: {
  initialValue?: TResult;
  children: Renderable<{
    isInProgress: boolean;
    didExecute: boolean;
    value?: TResult;
    call(params?: TParams): void;
  }>;
  activate(
    axios: AxiosInstance,
    params?: TParams
  ): Promise<AxiosResponse<TResult>>;
}) {
  return (
    <State
      initialState={{
        didExecute: false,
        isInProgress: false,
        value: props.initialValue
      }}
    >
      {({ state, setState }) => (
        <Lifecycle>
          {props.children({
            didExecute: state.didExecute,
            isInProgress: state.isInProgress,
            value: state.value,
            async call(params) {
              setState({
                isInProgress: true
              });

              const response = await props.activate(axios, params);

              setState({
                didExecute: true,
                isInProgress: false,
                value: response.data
              });
            }
          })}
        </Lifecycle>
      )}
    </State>
  );
}
