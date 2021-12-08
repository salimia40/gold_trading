import { Prisma } from "@prisma/client";
import { intArg, nullable, objectType, queryField } from "nexus";
import { prisma } from "../../services/db";

export const BlockoperationsPayload = objectType({
  name: "BlockoperationsPayload",
  definition(t) {
    t.list.field("blockoperations", { type: "Blockoperation" });
    t.nullable.field("pagination", { type: "PaginationResult" });
  },
});

export const BlockresultsPayload = objectType({
  name: "BlockresultsPayload",
  definition(t) {
    t.list.field("blockresults", { type: "Blockresult" });
    t.nullable.field("pagination", { type: "PaginationResult" });
  },
});

export const Blockoperations = queryField("Blockoperations", {
  type: "BlockoperationsPayload",
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

    const query: Prisma.BlockoperationFindManyArgs = {};
    const countQ: Prisma.BlockoperationCountArgs = {};
    query.where = {};
    countQ.where = {};

    if (sort != null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    if (pagination != null) {
      let totalPage: number, perPage: number, page: number;
      let total = await prisma.blockoperation.count(countQ);
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
      blockresults: true,
    };

    let blockoperations = await prisma.blockoperation.findMany(query);

    Object.assign(result, "blockoperations", blockoperations);

    return result;
  },
});

export const Blockresults = queryField("Blockresults", {
  type: "BlockresultsPayload",
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

    const query: Prisma.BlockresultFindManyArgs = {};
    const countQ: Prisma.BlockresultCountArgs = {};
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
      let total = await prisma.blockresult.count(countQ);
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

    let blockresults = await prisma.blockresult.findMany(query);

    Object.assign(result, "blockresults", blockresults);

    return result;
  },
});

export const myBlockresults = queryField("myBlockresults", {
  type: "BlockresultsPayload",
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

    const query: Prisma.BlockresultFindManyArgs = {};
    const countQ: Prisma.BlockresultCountArgs = {};
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
      let total = await prisma.blockresult.count(countQ);
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

    let blockresults = await prisma.blockresult.findMany(query);

    Object.assign(result, "blockresults", blockresults);

    return result;
  },
});
