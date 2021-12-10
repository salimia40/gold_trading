import { PrismaClient, User } from "@prisma/client";
import { Request } from "express";
import { prisma } from "../services/db";
import { buildContext, PassportContext } from "graphql-passport";
import { PubSub } from "graphql-subscriptions";
import { pubsub } from "../services/pubsub";

export interface Context extends PassportContext<User, Request> {
  prisma: PrismaClient;
  req: any; // HTTP request carrying the `Authorization` header
  pubsub: PubSub;
}

export function createContext(req: any) {
  return buildContext({
    ...req,
    prisma,
    pubsub,
  });
}
