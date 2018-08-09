declare module "castv2-client" {
  import { EventEmitter } from "events";

  export class DefaultMediaReceiver {
    constructor(client: Client, session: any);
    createController(
      controller: any,
      ...args: any[]
    ): RequestResponseController;
  }

  export class RequestResponseController {
    request(data: any, callback: (err, response: any) => void);
  }

  export class Client extends EventEmitter {
    close(): any;
    connect(arg0: any, arg1: any): any;
  }
}
