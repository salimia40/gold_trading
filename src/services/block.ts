import { prisma } from "./db";
import { reduce } from "p-iteration";
import { Prisma, Bill } from "@prisma/client";
import { forEach, map } from "p-iteration";
import * as R from "ramda";
import { userCommition } from "./user";
import { emmiter } from "./events";
import setting from "./setting";

export async function countBlock(user_id: number, is_sell: boolean) {
  const block = await prisma.block.findUnique({ where: { user_id } });
  if (block?.is_sell !== is_sell) {
    const bills = await prisma.bill.findMany({
      where: {
        user_id,
        is_sell: block?.is_sell!,
        left_amount: { gt: 0 },
        is_settled: false,
      },
    });

    let amount = await reduce(bills, (acc, bill) => bill.left_amount! + acc, 0);

    amount = block?.amount! > amount ? amount : block?.amount!;
    await prisma.block.update({ where: { user_id }, data: { amount } });
  }
}

export async function getBlocks(
  sort: "asc" | "desc" = "asc",
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
  const query: Prisma.BlockoperationFindManyArgs = {};
  const countQ: Prisma.BlockoperationCountArgs = {};
  query.where = {};
  countQ.where = {};
  query.include = {
    blockresults: true,
  };

  if (sort != null) {
    query.orderBy = {
      created_at: sort,
    };
  }

  let totalPage: number = 1;
  let total = await prisma.blockoperation.count(countQ);
  if (paginate) {
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    query.skip = (page - 1) * perPage;
    query.take = perPage;
  }

  let blockoperations = await prisma.blockoperation.findMany(query);

  return {
    items: blockoperations,
    page,
    perPage,
    total,
    totalPage,
  };
}

export async function getBlockResults(
  user_id: number | null,
  sort: "asc" | "desc" = "asc",
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
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

  let totalPage: number = 1;
  let total = await prisma.blockresult.count(countQ);
  if (paginate) {
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    query.skip = (page - 1) * perPage;
    query.take = perPage;
  }

  let blockresults = await prisma.blockresult.findMany(query);

  return {
    items: blockresults,
    page,
    perPage,
    total,
    totalPage,
  };
}

export async function doBlock(operator_id: number) {
  await setting.set("TARADING_ACTIVATED", false);

  const users = await prisma.user.findMany({
    where: { verified: true },
  });
  let userBills = await map(users, async ({ id }) => {
    return {
      bills: await prisma.bill.findMany({
        where: { left_amount: { gt: 0 }, is_settled: true, user_id: id },
      }),
      user_id: id,
    };
  });

  userBills = R.filter(({ bills }) => bills.length > 0, userBills);

  let amounts = await map(userBills, async ({ bills, user_id }) => {
    let amount = R.reduce((amc, bill: Bill) => {
      return bill!.is_sell
        ? amc + bill?.left_amount!
        : amc - bill?.left_amount!;
    }, 0)(bills);
    let is_sell = amount > 0;
    return { user_id, amount: Math.abs(amount), is_sell };
  });

  amounts = R.filter(({ amount }) => amount != 0, amounts);

  amounts = await map(amounts, async ({ user_id, is_sell, amount }) => {
    const block = await prisma.block.findUnique({ where: { user_id } });
    let diff =
      block?.is_sell == is_sell && block.amount > 0
        ? amount > block.amount
          ? amount - block.amount
          : 0
        : amount;

    return { is_sell, amount: diff, user_id };
  });

  amounts = R.filter(({ amount }) => amount != 0, amounts);

  const operation = await prisma.blockoperation.create({
    data: {
      operator_id,
    },
  });

  await forEach(amounts, async ({ user_id, is_sell, amount }) => {
    await prisma.block.update({
      where: { user_id },
      data: {
        amount,
        is_sell,
      },
    });

    let commitionFee = await userCommition(user_id);
    let commition = commitionFee * amount;
    await prisma.commition.create({
      data: {
        user_id,
        amount: commition,
      },
    });

    let blockresult = await prisma.blockresult.create({
      data: {
        operation_id: operation.id,
        user_id,
        commition,
      },
    });

    emmiter.emit("block", blockresult);
  });
}
