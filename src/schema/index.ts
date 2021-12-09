import { applyMiddleware } from "graphql-middleware";
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
import * as transactionMutations from "./transaction/transactionMutations";
import * as transactionQueries from "./transaction/transactionQueries";
import * as settingQueries from "./setting/settingQueries";
import * as settingMutations from "./setting/settingMutations";
import * as tradingMutations from "./trading/tradingMutations";
import * as tradingQueries from "./trading/tradingQueries";
import * as blockMutations from "./block/blockMutations";
import * as blockQueries from "./block/blockQueries";
import * as settleMutations from "./settle/settleMutations";
import * as settleQueries from "./settle/settleQueries";

import * as ModelTypes from "./types/model_types";

import { permissions } from "./permissions";

import { AuthMutations } from "./authentication";
import { Upload } from "./upload";

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
    t.nullable.string("error");
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
    AuthMutations,
    userQueries,
    userMutations,
    transactionMutations,
    transactionQueries,
    Upload,
    settingQueries,
    settingMutations,
    tradingMutations,
    tradingQueries,
    blockMutations,
    blockQueries,
    settleMutations,
    settleQueries,
  ],
  outputs: {
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
