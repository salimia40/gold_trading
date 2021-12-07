import { Prisma } from ".prisma/client";
import {
  booleanArg,
  intArg,
  list,
  nullable,
  objectType,
  queryField,
} from "nexus";

export const OffersPayload = objectType({
  name: "OffersPayload",
  definition(t) {
    t.list.field("offers", { type: "Offer" });
    t.nullable.field("pagination", { type: "PaginationResult" });
  },
});

export const BillsPayload = objectType({
  name: "BillsPayload",
  definition(t) {
    t.list.field("bills", { type: "Bill" });
    t.nullable.field("pagination", { type: "PaginationResult" });
  },
});

export const DealsPayload = objectType({
  name: "DealsPayload",
  definition(t) {
    t.list.field("deals", { type: "Deal" });
    t.nullable.field("pagination", { type: "PaginationResult" });
  },
});

export const offers = queryField("offers", {
  type: list("OffersPayload"),
  args: {
    is_expired: nullable(booleanArg()),
    sort: nullable("SortOrder"),
    pagination: nullable("PaginationRequest"),
  },
  //   @ts-ignore
  resolve: async (_, { is_expired, sort, pagination }, context) => {
    let query: Prisma.OfferFindManyArgs = {};
    let cQuery: Prisma.OfferCountArgs = {};

    if (is_expired != null) {
      query.where = {
        is_expired,
      };
      cQuery.where = {
        is_expired,
      };
    }
    if (sort != null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    let result = {};

    if (pagination != null) {
      let totalPage: number, perPage: number, page: number;
      let total = await context.prisma.offer.count(cQuery);
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

    let offers = await context.prisma.offer.findMany(query);

    Object.assign(result, "offers", offers);

    return result;
  },
});

export const bills = queryField("bills", {
  type: "BillsPayload",
  args: {
    is_sell: nullable(booleanArg()),
    user_id: nullable(intArg()),
    is_settled: nullable(booleanArg()),
    is_open: nullable(booleanArg()),
    sort: nullable("SortOrder"),
    pagination: nullable("PaginationRequest"),
  },
  // @ts-ignore
  resolve: async (
    _,
    { is_sell, is_open, is_settled, user_id, sort, pagination },
    context,
  ) => {
    let query: Prisma.BillFindManyArgs = {};
    let cQuery: Prisma.BillCountArgs = {};
    query.where = {};
    cQuery.where = {};

    if (user_id != null) {
      query.where.user_id = user_id;
      cQuery.where.user_id = user_id;
    }
    if (is_sell != null) {
      query.where.is_sell = is_sell;
      cQuery.where.is_sell = is_sell;
    }
    if (is_settled != null) {
      query.where.is_settled = is_settled;
      cQuery.where.is_settled = is_settled;
    }
    if (is_open != null) {
      if (is_open) {
        query.where.left_amount = { gt: 0 };
        cQuery.where.left_amount = { gt: 0 };
      } else {
        query.where.left_amount = 0;
        cQuery.where.left_amount = 0;
      }
    }
    if (sort != null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    let result = {};

    if (pagination != null) {
      let totalPage: number, perPage: number, page: number;
      let total = await context.prisma.bill.count(cQuery);
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

    let bills = await context.prisma.bill.findMany(query);

    Object.assign(result, "bills", bills);

    return result;
  },
});

export const myBills = queryField("myBills", {
  type: "BillsPayload",
  args: {
    is_sell: nullable(booleanArg()),
    user_id: nullable(intArg()),
    is_settled: nullable(booleanArg()),
    is_open: nullable(booleanArg()),
    sort: nullable("SortOrder"),
    pagination: nullable("PaginationRequest"),
  },
  //   @ts-ignore
  resolve: async (
    _,
    { is_sell, is_open, is_settled, sort, pagination },
    context,
  ) => {
    let user_id = context.getUser()?.id!;
    let query: Prisma.BillFindManyArgs = {};
    let cQuery: Prisma.BillCountArgs = {};
    query.where = {
      user_id,
    };
    cQuery.where = {
      user_id,
    };
    if (is_sell != null) {
      query.where.is_sell = is_sell;
      cQuery.where.is_sell = is_sell;
    }
    if (is_settled != null) {
      query.where.is_settled = is_settled;
      cQuery.where.is_settled = is_settled;
    }
    if (is_open != null) {
      if (is_open) {
        query.where.left_amount = { gt: 0 };
        cQuery.where.left_amount = { gt: 0 };
      } else {
        query.where.left_amount = 0;
        cQuery.where.left_amount = 0;
      }
    }
    if (sort != null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    let result = {};

    if (pagination != null) {
      let totalPage: number, perPage: number, page: number;
      let total = await context.prisma.bill.count(cQuery);
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

    let bills = await context.prisma.bill.findMany(query);

    Object.assign(result, "bills", bills);

    return result;
  },
});

export const deals = queryField("deals", {
  type: "DealsPayload",
  args: {
    is_sell: nullable(booleanArg()),
    user_id: nullable(intArg()),
    is_settled: nullable(booleanArg()),
    sort: nullable("SortOrder"),
    pagination: nullable("PaginationRequest"),
  },
  //   @ts-ignore
  resolve: async (
    _,
    { is_sell, is_settled, user_id, sort, pagination },
    context,
  ) => {
    let query: Prisma.DealFindManyArgs = {};
    let cQuery: Prisma.DealCountArgs = {};
    query.where = {};
    cQuery.where = {};

    if (user_id != null) {
      query.where.user_id = user_id;
      cQuery.where.user_id = user_id;
    }
    if (is_sell != null) {
      query.where.is_sell = is_sell;
      cQuery.where.is_sell = is_sell;
    }
    if (is_settled != null) {
      query.where.is_settled = is_settled;
      cQuery.where.is_settled = is_settled;
    }

    if (sort != null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    let result = {};

    if (pagination != null) {
      let totalPage: number, perPage: number, page: number;
      let total = await context.prisma.deal.count(cQuery);
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
    let deals = await context.prisma.deal.findMany(query);

    Object.assign(result, "deals", deals);

    return result;
  },
});

export const myDeals = queryField("myDeals", {
  type: "DealsPayload",
  args: {
    is_sell: nullable(booleanArg()),
    is_settled: nullable(booleanArg()),
    sort: nullable("SortOrder"),
    pagination: nullable("PaginationRequest"),
  },
  //   @ts-ignore
  resolve: async (
    _,
    { is_sell, is_settled, sort, pagination },
    context,
  ) => {
    let user_id = context.getUser()?.id!;
    let query: Prisma.DealFindManyArgs = {};
    let cQuery: Prisma.DealCountArgs = {};
    query.where = {
      user_id,
    };
    cQuery.where = {
      user_id,
    };

    if (is_sell != null) {
      query.where.is_sell = is_sell;
      cQuery.where.is_sell = is_sell;
    }
    if (is_settled != null) {
      query.where.is_settled = is_settled;
      cQuery.where.is_settled = is_settled;
    }

    if (sort != null) {
      query.orderBy = {
        created_at: sort,
      };
    }

    let result = {};

    if (pagination != null) {
      let totalPage: number, perPage: number, page: number;
      let total = await context.prisma.deal.count(cQuery);
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
    let deals = await context.prisma.deal.findMany(query);

    Object.assign(result, "deals", deals);

    return result;
  },
});
