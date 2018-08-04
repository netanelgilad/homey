import { RestAction } from "../rest-actions/RestAction";
import { Device } from "./Device";

export const getDevicesRestAction: RestAction<{}, Array<Device>> = {
  method: "get",
  path: "/devices",
  parameters: {}
};
