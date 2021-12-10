import { ApolloServer } from "apollo-server-express";
import * as Http from "http";
import { createContext } from "./schema/context";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { schema } from "./schema";
import { execute, subscribe } from "graphql";
import "./services/storage";

import app from "./express";

export const httpServer = Http.createServer(app);

const subscriptionServer = SubscriptionServer.create({
  // This is the `schema` we just created.
  schema,
  // These are imported from `graphql`.
  execute,
  subscribe,
}, {
  // This is the `httpServer` we created in a previous step.
  server: httpServer,
  // Pass a different path here if your ApolloServer serves at
  // a different path.
  path: "/graphql",
});

const server = new ApolloServer({
  schema,
  context: createContext,
  plugins: [{
    async serverWillStart() {
      return {
        async drainServer() {
          subscriptionServer.close();
        },
      };
    },
  }],
});

export const start = async () => {
  await server.start();
  server.applyMiddleware({ app, cors: false });
};

start().then(() =>
  httpServer.listen({ port: 4000 }, () => {
    console.log(`server at http://localhost:4000${server.graphqlPath}`);
    console.log(
      `Subscriptions server at ws://localhost:4000${server.graphqlPath}`,
    );
  })
);
