import { ApolloServer } from "apollo-server-express";
import * as Http from "http";
import { createContext } from "./schema/context";
import { schema } from "./schema";

import "./services/storage";

import app from "./express";

const server = new ApolloServer({
  schema,
  context: createContext,
});

server.start();
server.applyMiddleware({ app, cors: false });

const httpServer = Http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen({ port: 4000 }, () => {
  console.log(`server at http://localhost:4000${server.graphqlPath}`);
  console.log(
    `Subscriptions server at ws://localhost:4000${server.subscriptionsPath}`,
  );
});
