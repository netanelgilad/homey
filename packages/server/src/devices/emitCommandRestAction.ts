import { RestAction, RestParameterLocation } from "../rest-actions/RestAction";

export const emitCommandRestAction: RestAction<
  {
    name: string;
  },
  void
> = {
  method: "post",
  path: "/command/{name}",
  parameters: {
    name: { location: RestParameterLocation.Path, required: true }
  }
};
