import { Prisma } from "@prisma/client";
import { intArg, nullable, objectType, queryField } from "nexus";
import { prisma } from "../../services/db";

export const settlesPayload = objectType({
  name: "settlesPayload",
  definition(t) {
    t.list.field("settles", { type: "Settle" });
    t.nullable.field("pagination", { type: "PaginationResult" });
  },
});

export const SettleresultsPayload = objectType({
  name: "SettleresultsPayload",
  definition(t) {
    t.list.field("Settleresults", { type: "SettleResult" });
    t.nullable.field("pagination", { type: "PaginationResult" });
  },
});

export const settles = queryField("settles", {
  type: "settlesPayload",
  args: {
    sort: nullable("SortOrder"),
    pagination: nullable("PaginationRequest"),
  },
  resolve: async (
    _parent,
    { sort, pagination },
    context,
  ) => {
    let result = {};

    const query: Prisma.SettleFindManyArgs = {};
    const countQ: Prisma.SettleCountArgs = {};
    query.where = {};
    countQ.where = {};

    if (sort != null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    if (pagination != null) {
      let totalPage: number, perPage: number, page: number;
      let total = await prisma.settle.count(countQ);
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

    query.include = {
      settleresults: true,
    };

    let settles = await prisma.settle.findMany(query);

    Object.assign(result, "settles", settles);

    return result;
  },
});

export const settleresults = queryField("settleresults", {
  type: "SettleresultsPayload",
  args: {
    sort: nullable("SortOrder"),
    user_id: nullable(intArg()),
    pagination: nullable("PaginationRequest"),
  },
  resolve: async (
    _parent,
    { sort, pagination, user_id },
    context,
  ) => {
    let result = {};

    const query: Prisma.SettleresultFindManyArgs = {};
    const countQ: Prisma.SettleresultCountArgs = {};
    query.where = {};
    countQ.where = {};

    if (user_id != null) {
      query.where.user_id = user_id;
      countQ.where.user_id = user_id;
    }

    if (sort != null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    if (pagination != null) {
      let totalPage: number, perPage: number, page: number;
      let total = await prisma.settleresult.count(countQ);
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

    let Settleresults = await prisma.settleresult.findMany(query);

    Object.assign(result, "Settleresults", Settleresults);

    return result;
  },
});

export const mySettleresults = queryField("mySettleresults", {
  type: "SettleresultsPayload",
  args: {
    sort: nullable("SortOrder"),
    pagination: nullable("PaginationRequest"),
  },
  resolve: async (
    _parent,
    { sort, pagination },
    context,
  ) => {
    let result = {};

    const query: Prisma.SettleresultFindManyArgs = {};
    const countQ: Prisma.SettleresultCountArgs = {};
    query.where = {};
    countQ.where = {};

    query.where = {
      user_id: context.getUser()?.id!,
    };
    countQ.where = {
      user_id: context.getUser()?.id!,
    };

    if (sort != null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    if (pagination != null) {
      let totalPage: number, perPage: number, page: number;
      let total = await prisma.settleresult.count(countQ);
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

    let Settleresults = await prisma.settleresult.findMany(query);

    Object.assign(result, "Settleresults", Settleresults);

    return result;
  },
});
