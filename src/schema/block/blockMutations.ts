import { Bill } from ".prisma/client";
import { mutationField } from "nexus";
import { forEach, map } from "p-iteration";
import * as R from "ramda";
import { prisma } from "../../services/db";
import { userCommition } from "../../services/user";

export const doBlock = mutationField("doBlock", {
  type: "ActionResult",
  resolve: async (_, args, context) => {
    const users = await context.prisma.user.findMany({
      where: { verified: true },
    });
    let userBills = await map(
      users,
      async ({ id }) => {
        return {
          bills: await prisma.bill.findMany({
            where: { left_amount: { gt: 0 }, is_settled: true, user_id: id },
          }),
          user_id: id,
        };
      },
    );

    userBills = R.filter(({ bills }) => bills.length > 0, userBills);

    let amounts = await map(userBills, async ({ bills, user_id }) => {
      let amount = R.reduce((amc, bill: Bill) => {
        return bill!.is_sell
          ? amc + bill?.left_amount!
          : amc - bill?.left_amount!;
      }, 0)(bills);
      let is_sell = amount > 0;
      return ({ user_id, amount: Math.abs(amount), is_sell });
    });

    amounts = R.filter(({ amount }) => amount != 0, amounts);

    amounts = await map(amounts, async ({ user_id, is_sell, amount }) => {
      const block = await prisma.block.findUnique({ where: { user_id } });
      let diff = (block?.is_sell == is_sell && block.amount > 0)
        ? ((amount > block.amount) ? amount - block.amount : 0)
        : amount;

      return { is_sell, amount: diff, user_id };
    });

    amounts = R.filter(({ amount }) => amount != 0, amounts);

    const operation = await prisma.blockoperation.create({
      data: {
        operator_id: context.getUser()!.id,
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

      await prisma.blockresult.create({
        data: {
          operation_id: operation.id,
          user_id,
          commition,
        },
      });

      // TODO notify user
    });

    return { success: true };
  },
});
