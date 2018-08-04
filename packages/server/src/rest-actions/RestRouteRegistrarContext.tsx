import { createContext } from "react";
import { RestActionHandlerType, RestActionHandlerFunction } from './RestActionHandler';

export type RouteID = number;

export type RestRouteRegistrarContextType = {
    registerRoute<TParams, TResult>(
        restActionHandler: RestActionHandlerType<TParams, TResult>
    ): RouteID;
    updateRouteHandler<TParams, TResult>(
        routeId: RouteID,
        handler: RestActionHandlerFunction<TParams, TResult>
    )
}

export const RestRouteRegistrarContext = createContext<RestRouteRegistrarContextType>(undefined);
