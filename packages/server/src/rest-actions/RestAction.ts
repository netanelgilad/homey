export enum RestParameterLocation {
  Query,
  Path,
  FormData
}

export enum RestResponseType {
  Stream
}

export type RestAction<TParams extends {}, _TResult> = {
  method: "get" | "post";
  path: string;
  parameters: {
    [K in keyof TParams]: {
      location: RestParameterLocation;
      required?: boolean;
    }
  };
  responseType?: RestResponseType;
};
