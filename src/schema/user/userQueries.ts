import { Prisma } from ".prisma/client";
import {
  booleanArg,
  intArg,
  nonNull,
  nullable,
  objectType,
  queryField,
} from "nexus";
import { prisma } from "../../services/db";
import { Context } from "../context";

export const UsersResult = objectType({
  name: "UsersResult",
  definition(t) {
    t.list.field("users", {
      type: "User",
    });
    t.nullable.field("pagination", {
      type: "PaginationResult",
    });
  },
});

export const UserResult = objectType({
  name: "UserResult",
  definition(t) {
    t.field("user", {
      type: "User",
    });
    t.nullable.field("pagination", {
      type: "PaginationResult",
    });
  },
});

export const getUsers = queryField("getUsers", {
  type: "UsersResult",
  args: {
    role: nullable("UserRole"),
    sort: nullable("SortOrder"),
    verified: nullable(booleanArg()),
    pagination: nullable("PaginationRequest"),
  },
  resolve: async (
    _parent,
    { role, sort, pagination, verified },
    context: Context,
  ) => {
    let result = {};

    const query: Prisma.UserFindManyArgs = {};
    const countQ: Prisma.UserCountArgs = {};
    query.where = {};
    countQ.where = {};
    if (role !== null) {
      query.where.role = role;
      countQ.where.role = role;
    }
    if (verified !== null) {
      query.where.verified = verified;
      countQ.where.verified = verified;
    }
    if (sort !== null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    if (pagination !== null) {
      let totalPage: number, perPage: number, page: number;
      let total = await prisma.user.count(countQ);
      perPage = pagination?.perPage || 10;
      totalPage = Math.ceil(total / perPage);
      page = pagination?.page || 1;
      if (page > totalPage) {
        page = 1;
      }
      let skip = (page - 1) * perPage;

      query.skip = skip;
      query.take = perPage;

      Object.assign(result, "pagination", {
        totalPage,
        perPage,
        page,
      });
    }

    const users = await prisma.user.findMany(query);

    Object.assign(result, "users", users);

    return result;
  },
});

export const getUser = queryField("getUser", {
  type: "UserResult",
  args: {
    user_id: nonNull(intArg()),
  },
  // @ts-ignore
  resolve: async (parent, args, context: Context) => {
    const user = await context.prisma.user.findUnique({
      where: { id: args.user_id },
      include: {
        chargeinfo: true,
        block: true,
        documents: true,
        gifts: true,
      },
    });

    return { user };
  },
});

export const me = queryField("me", {
  type: "UserResult",
  // @ts-ignore
  resolve: async (parent, args, context: Context) => {
    const user = await context.prisma.user.findUnique({
      where: {
        id: context.getUser()?.id,
      },
      include: {
        chargeinfo: true,
        block: true,
        documents: true,
        gifts: true,
      },
    });
    return { user: user };
  },
});
