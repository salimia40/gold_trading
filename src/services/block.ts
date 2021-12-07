import { prisma } from "./db";
import { reduce } from "p-iteration";

export async function countBlock(
  user_id: number,
  is_sell: boolean,
) {
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

    let amount = await reduce(
      bills,
      (acc, bill) => bill.left_amount! + acc,
      0,
    );

    amount = block?.amount! > amount ? amount : block?.amount!;
    await prisma.block.update({ where: { user_id }, data: { amount } });
  }
}
