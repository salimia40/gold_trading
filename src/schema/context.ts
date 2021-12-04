import { PrismaClient, User } from "@prisma/client";
import { Request } from "express";
import { prisma } from "../services/db";
import { buildContext, PassportContext } from "graphql-passport";

export interface Context extends PassportContext<User, Request> {
  prisma: PrismaClient;
  req: any; // HTTP request carrying the `Authorization` header
}

export function createContext(req: any) {
  return buildContext({
    ...req,
    prisma,
  });
}
