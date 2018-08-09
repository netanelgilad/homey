import * as React from "react";
import { Resource, Renderable } from "@react-atoms/core";
import { createBrowser, tcp } from "mdns";

export function ChromecastAddress(props: {
  name: string;
  children: Renderable<{ address: string }>;
}) {
  return (
    <Resource
      createResource={() => {
        return new Promise<string>(resolve => {
          const browser = createBrowser(tcp("googlecast"));

          browser.on("serviceUp", service => {
            if (service.txtRecord.fn === props.name) {
              console.log("Found requested chromecast, stopped looking.");
              browser.stop();
              resolve(service.addresses[0]);
            }
          });

          console.log("Looking for chromecasts...");
          browser.start();
        });
      }}
    >
      {({ resource }) => props.children({ address: resource })}
    </Resource>
  );
}