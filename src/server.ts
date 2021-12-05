import { ApolloServer } from "apollo-server-express";

import { createContext } from "./schema/context";
import { schema } from "./schema";

import "./services/storage";

import app from "./express";

const server = new ApolloServer({
  schema,
  context: createContext,
});

const startServer = (async () => {
  await server.start();
  server.applyMiddleware({ app, cors: false });
});

startServer().then(() => {
  const PORT = 5050;
  app.listen({ port: PORT }, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`,
    );
  });
});
