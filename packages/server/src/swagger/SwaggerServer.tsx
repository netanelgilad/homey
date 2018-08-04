import * as React from "react";
import { Lifecycle, Variable } from "@react-atoms/core";
import { initializeMiddleware } from "swagger-tools";
import * as connect from "connect";
import { createServer } from "http";
import { RestRouteRegistrarContext, RouteID } from "../rest-actions/RestRouteRegistrarContext";
import {
  RestActionHandlerType,
  RestActionHandlerFunction
} from "../rest-actions/RestActionHandler";
import { map, mapValues } from "lodash";
import { v4 } from "uuid";
import { RestParameterLocation, RestResponseType } from "../rest-actions/RestAction";
import { Map } from "immutable";

export function SwaggerServer(props: {
  port: number;
  children?: React.ReactNode;
}) {
  return (
    <Variable
      initialValue={{
        routeId: 0,
        routes: Map<number, RestActionHandlerType>(),
        handlers: Map<number, RestActionHandlerFunction>()
      }}
    >
      {({ getValue, setValue }) => (
        <RestRouteRegistrarContext.Provider
          value={{
            registerRoute(restActionHandler) {
              const newRouteId = getValue().routeId + 1;

              setValue({
                handlers: getValue().handlers.set(
                  newRouteId,
                  restActionHandler.handler
                ),
                routes: getValue().routes.set(newRouteId, restActionHandler),
                routeId: newRouteId
              });

              return newRouteId;
            },
            updateRouteHandler(routeId, handler) {
              setValue({
                handlers: getValue().handlers.set(routeId, handler)
              });
            }
          }}
        >
          <Lifecycle
            onDidMount={() => {
              const app = connect();
              const { controllers, spec } = getSwaggerObject(
                getValue().routes,
                (routeId) => getValue().handlers.get(routeId)
              );

              initializeMiddleware(spec, middleware => {
                app.use(middleware.swaggerMetadata());
                app.use(
                  middleware.swaggerValidator({
                    validateResponse: true
                  })
                );
                app.use(
                  middleware.swaggerRouter({
                    controllers
                  })
                );
                app.use(middleware.swaggerUi());
                createServer(app).listen(props.port);
              });
            }}
          >
            {props.children || null}
          </Lifecycle>
        </RestRouteRegistrarContext.Provider>
      )}
    </Variable>
  );
}

export function getSwaggerObject(
  routes: Map<RouteID,RestActionHandlerType>,
  getHandler: (routeId: RouteID) => RestActionHandlerFunction
) {
  const { controllers, paths } = routes.reduce(
    (result, restActionHandler, routeId) => {
      const controllerId = v4();

      const parameters = map(
        restActionHandler.restAction.parameters,
        (parameter, name) => ({
          name,
          in: restParameterLocationToSwaggerLocation(parameter.location),
          type: "string",
          required: !!parameter.required
        })
      );

      return {
        controllers: {
          ...result.controllers,
          [controllerId]: async (req, res, next) => {
            try {
              const handler = getHandler(routeId);
              const result = await handler(
                mapValues(req.swagger.params, "value")
              );
              if (restActionHandler.restAction.responseType === RestResponseType.Stream) {
                result.pipe(res);
              }
              else {
                res.end(JSON.stringify(result));
              }
            } catch (err) {
              next(err);
            }
          }
        },
        paths: {
          ...result.paths,
          [restActionHandler.restAction.path]: {
            [restActionHandler.restAction.method]: {
              operationId: controllerId,
              parameters,
              responses: {
                "200": {
                  description: "OK response",
                  schema: {}
                }
              }
            }
          }
        }
      };
    },
    {
      controllers: {},
      paths: {}
    }
  );

  const spec = {
    swagger: "2.0",
    info: {
      version: "1.0.0",
      title: "Swagger Petstore",
      contact: {
        name: "Wordnik API Team",
        url: "http://developer.wordnik.com"
      },
      license: {
        name: "Creative Commons 4.0 International",
        url: "http://creativecommons.org/licenses/by/4.0/"
      }
    },
    basePath: "/api",
    schemes: ["http"],
    paths: {
      ...paths
    },
    definitions: {},
    produces: ["application/json", "application/xml", "text/plain", "text/html"]
  };

  return {
    controllers,
    spec
  };
}

export function restParameterLocationToSwaggerLocation(
  location: RestParameterLocation
) {
  switch (location) {
    case RestParameterLocation.Path:
      return "path";
    case RestParameterLocation.FormData:
      return "formData";
  }
}
