import { Prisma } from ".prisma/client";
import { booleanArg, intArg, nullable, objectType, queryField } from "nexus";
import { prisma } from "../../services/db";
import { Context } from "../context";

export const TransactionsPayload = objectType({
  name: "TransactionsPayload",
  definition(t) {
    t.list.field("transactions", {
      type: "Transaction",
    });
    t.nullable.field("pagination", {
      type: "PaginationResult",
    });
  },
});

export const TransactionPayload = objectType({
  name: "TransactionPayload",
  definition(t) {
    t.nonNull.field("transactions", {
      type: "Transaction",
    });
  },
});

export const getTransactions = queryField("getTransactions", {
  type: "TransactionsPayload",
  args: {
    user_id: nullable(intArg()),
    sort: nullable("SortOrder"),
    is_confirmed: nullable(booleanArg()),
    is_done: nullable(booleanArg()),
    transaction_type: nullable("TransactionType"),
    pagination: nullable("PaginationRequest"),
  },
  resolve: async (
    _parent,
    { sort, pagination, is_confirmed, is_done, transaction_type, user_id },
    context: Context,
  ) => {
    let result = {};

    const query: Prisma.TransactionFindManyArgs = {};
    const countQ: Prisma.TransactionCountArgs = {};
    query.where = {};
    countQ.where = {};
    if (is_confirmed !== null) {
      query.where.is_confirmed = is_confirmed;
      countQ.where.is_confirmed = is_confirmed;
    }
    if (is_done !== null) {
      query.where.is_done = is_done;
      countQ.where.is_done = is_done;
    }
    if (transaction_type !== null) {
      query.where.transaction_type = transaction_type;
      countQ.where.transaction_type = transaction_type;
    }
    if (user_id !== null) {
      query.where.user_id = user_id;
      countQ.where.user_id = user_id;
    }
    if (sort !== null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    if (pagination !== null) {
      let totalPage: number, perPage: number, page: number;
      let total = await prisma.transaction.count(countQ);
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

    const transactions = await prisma.transaction.findMany(query);

    Object.assign(result, "transactions", transactions);

    return result;
  },
});

export const getMyTransactions = queryField("getMyTransactions", {
  type: "TransactionsPayload",
  args: {
    sort: nullable("SortOrder"),
    is_confirmed: nullable(booleanArg()),
    is_done: nullable(booleanArg()),
    transaction_type: nullable("TransactionType"),
    pagination: nullable("PaginationRequest"),
  },
  resolve: async (
    _parent,
    { sort, pagination, is_confirmed, is_done, transaction_type },
    context: Context,
  ) => {
    let result = {};

    const query: Prisma.TransactionFindManyArgs = {};
    const countQ: Prisma.TransactionCountArgs = {};
    query.where = {
      user_id: context.getUser()?.id!,
    };
    countQ.where = {
      user_id: context.getUser()?.id!,
    };
    if (is_confirmed !== null) {
      query.where.is_confirmed = is_confirmed;
      countQ.where.is_confirmed = is_confirmed;
    }
    if (is_done !== null) {
      query.where.is_done = is_done;
      countQ.where.is_done = is_done;
    }
    if (transaction_type !== null) {
      query.where.transaction_type = transaction_type;
      countQ.where.transaction_type = transaction_type;
    }
    if (sort !== null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    if (pagination !== null) {
      let totalPage: number, perPage: number, page: number;
      let total = await prisma.transaction.count(countQ);
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

    const transactions = await prisma.transaction.findMany(query);

    Object.assign(result, "transactions", transactions);

    return result;
  },
});
