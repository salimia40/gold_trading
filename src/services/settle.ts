import { prisma } from "./db";
import { Prisma, Bill } from "@prisma/client";
import { emmiter } from "./events";
import { settleTrade } from "./trade";
import { forEach, map } from "p-iteration";
import { filter, reduce } from "ramda";

export async function getSettles(
  sort: "asc" | "desc" = "asc",
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
  const query: Prisma.SettleFindManyArgs = {};
  const countQ: Prisma.SettleCountArgs = {};
  query.where = {};
  countQ.where = {};

  query.include = {
    settleresults: true,
  };

  if (sort != null) {
    query.orderBy = {
      created_at: sort,
    };
  }

  let totalPage: number = 1;
  let total = await prisma.settle.count(countQ);
  if (paginate) {
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    query.skip = (page - 1) * perPage;
    query.take = perPage;
  }

  let settles = await prisma.settle.findMany(query);

  return {
    items: settles,
    page,
    perPage,
    total,
    totalPage,
  };
}

export async function getSettleResults(
  user_id: number | null,
  settle_id: number | null,
  sort: "asc" | "desc" = "asc",
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
  const query: Prisma.SettleresultFindManyArgs = {};
  const countQ: Prisma.SettleresultCountArgs = {};
  query.where = {};
  countQ.where = {};

  if (user_id != null) {
    query.where.user_id = user_id;
    countQ.where.user_id = user_id;
  }

  if (settle_id != null) {
    query.where.settle_id = settle_id;
    countQ.where.settle_id = settle_id;
  }

  if (sort != null) {
    query.orderBy = {
      created_at: sort,
    };
  }

  let totalPage: number = 1;
  let total = await prisma.settleresult.count(countQ);
  if (paginate) {
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    query.skip = (page - 1) * perPage;
    query.take = perPage;
  }

  let settleresults = await prisma.settleresult.findMany(query);

  return {
    items: settleresults,
    page,
    perPage,
    total,
    totalPage,
  };
}

export async function doSettle(operator_id: number, price: number) {
  const users = await prisma.user.findMany({
    where: {
      verified: true,
    },
  });

  let amounts = await map(users, async (user) => {
    let bills = await prisma.bill.findMany({
      where: {
        user_id: user.id,
        is_settled: false,
        left_amount: { gt: 0 },
      },
    });

    let amount = reduce((acc, bill: Bill) => bill.left_amount! + acc, 0)(bills);
    let is_sell = bills.length > 0 ? bills[0].is_sell : false;
    return { user_id: user.id, amount, is_sell };
  });

  amounts = filter(({ amount }) => amount > 0, amounts);

  await forEach(amounts, async ({ user_id, amount, is_sell }) => {
    await settleTrade(user_id, price, amount, !is_sell);
  });

  let settle = await prisma.settle.create({
    data: {
      operator_id,
      price,
    },
  });

  await forEach(users, async (user) => {
    let commitions = await prisma.commition.findMany({
      where: {
        user_id: user.id,
        is_settled: false,
      },
    });
    let commition = reduce(
      (acc, commition) => commition?.amount!.toNumber() + acc,
      0,
      commitions
    );
    let deals = await prisma.deal.findMany({
      where: {
        user_id: user.id,
        is_settled: false,
      },
    });
    let profit = reduce(
      (acc, deal) => deal?.profit!.toNumber() + acc,
      0,
      deals
    );

    let settleresult = await prisma.settleresult.create({
      data: {
        settle_id: settle.id,
        profit,
        commition,
        user_id: user.id,
      },
    });

    emmiter.emit("settle", settleresult);
  });

  await prisma.bill.updateMany({
    where: {
      is_settled: false,
    },
    data: {
      is_settled: true,
      settle_id: settle.id,
    },
  });

  await prisma.deal.updateMany({
    where: {
      is_settled: false,
    },
    data: {
      is_settled: true,
      settle_id: settle.id,
    },
  });

  await prisma.commition.updateMany({
    where: {
      is_settled: false,
    },
    data: {
      is_settled: true,
      settle_id: settle.id,
    },
  });
}
