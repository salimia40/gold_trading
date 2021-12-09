import { Bill } from ".prisma/client";
import { intArg, mutationField, nonNull } from "nexus";
import { forEach, map } from "p-iteration";
import { filter, reduce } from "ramda";
import { prisma } from "../../services/db";
import setting from "../../services/setting";
import { processTrade, settleTrade } from "../../services/trade";

import * as R from "ramda";

export const deSettle = mutationField("doSettle", {
  type: "ActionResult",
  args: {
    price: nonNull(intArg()),
  },
  resolve: async (_, { price }, context) => {
    const users = await prisma.user.findMany({
      where: {
        verified: true,
      },
    });

    const commitionCONST = (await setting.get("COMMITION")) as number;

    let amounts = await map(users, async (user) => {
      let bills = await prisma.bill.findMany({
        where: {
          user_id: user.id,
          is_settled: false,
          left_amount: { gt: 0 },
        },
      });

      let amount = reduce((acc, bill: Bill) => bill.left_amount! + acc, 0)(
        bills,
      );
      let is_sell = (bills.length > 0) ? bills[0].is_sell : false;
      return { user_id: user.id, amount, is_sell };
    });

    amounts = filter(({ amount }) => amount > 0, amounts);

    await forEach(amounts, async ({ user_id, amount, is_sell }) => {
      await settleTrade(user_id, price, amount, !is_sell);
    });

    let settle = await prisma.settle.create({
      data: {
        operator_id: context.getUser()!.id,
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
        commitions,
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
        deals,
      );

      await prisma.settleresult.create({
        data: {
          settle_id: settle.id,
          profit,
          commition,
          user_id: user.id,
        },
      });
    });

    await prisma.bill.updateMany({
      where: {
        is_settled: false,
      },
      data: {
        is_settled: true,
      },
    });

    await prisma.deal.updateMany({
      where: {
        is_settled: false,
      },
      data: {
        is_settled: true,
      },
    });

    await prisma.commition.updateMany({
      where: {
        is_settled: false,
      },
      data: {
        is_settled: true,
      },
    });

    return { success: true };
  },
});
