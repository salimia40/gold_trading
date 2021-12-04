import { applyMiddleware } from "graphql-middleware";
import { GraphQLUpload } from "graphql-upload";
import { DateTimeResolver } from "graphql-scalars";

import {
  asNexusMethod,
  enumType,
  inputObjectType,
  makeSchema,
  objectType,
} from "nexus";

import nullGuard from "./plugins/nullguard";

import * as userQueries from "./user/userQueries";
import * as userMutations from "./user/userMutations";

import * as ModelTypes from "./types/model_types";

import { permissions } from "./permissions";

import { AuthMutations } from "./authentication";

export const DateTime = asNexusMethod(DateTimeResolver, "date");

const SortOrder = enumType({
  name: "SortOrder",
  members: ["asc", "desc"],
});

const PaginationRequest = inputObjectType({
  name: "PaginationRequest",
  definition(t) {
    t.nonNull.int("page");
    t.nullable.int("perPage");
  },
});

const PaginationResult = objectType({
  name: "PaginationResult",
  definition(t) {
    t.nonNull.int("page");
    t.nonNull.int("perPage");
    t.nonNull.int("totalPage");
  },
});

const ActionResult = objectType({
  name: "ActionResult",
  definition(t) {
    t.nonNull.boolean("success");
  },
});

const schemaWithoutPermissions = makeSchema({
  types: [
    DateTime,
    SortOrder,
    PaginationRequest,
    PaginationResult,
    ActionResult,
    ModelTypes,
    GraphQLUpload,
    AuthMutations,
    userQueries,
    userMutations,
  ],
  outputs: {
    schema: __dirname + "../../schema.graphql",
    typegen: __dirname + "/generated/nexus.ts",
  },
  contextType: {
    module: require.resolve("./context"),
    export: "Context",
  },
  sourceTypes: {
    modules: [
      {
        module: "@prisma/client",
        alias: "prisma",
      },
    ],
  },
});

export const schema = applyMiddleware(schemaWithoutPermissions, permissions);
