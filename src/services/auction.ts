import { prisma } from "./db";
import { filter, forEach, reduce } from "p-iteration";
import setting from "./setting";

export async function countAuction(user_id: number) {
  const chargeInfo = await prisma.chargeinfo.findUnique({
    where: { user_id },
  });

  const bills = await prisma.bill.findMany({
    where: {
      user_id,
      left_amount: {
        gt: 0,
      },
    },
  });

  let amount = await reduce(bills, (acc, bill) => {
    return bill.is_sell ? acc + bill.left_amount! : acc - bill.left_amount!;
  }, 0);

  let is_sell = amount > 0;

  let filteredBills = await filter(bills, (bill) => {
    return bill.is_sell == is_sell;
  });

  amount = 0;
  let value = 0;
  await forEach(filteredBills, (bill) => {
    amount += bill.left_amount!;
    value += bill.left_amount! * bill.price!;
  });

  if (amount == 0) {
    await prisma.auction.update({
      where: { user_id },
      data: {
        is_sell,
        price: 0,
        margin: 0,
        is_triggered: false,
      },
    });
    return;
  }

  let avrage = amount == 0 ? 0 : value / amount;

  let price = chargeInfo?.charge
    .mul(4.3318)
    .dividedBy(100)
    .mul(0.85)
    .dividedBy(amount)
    .toNumber()!;

  price = is_sell ? avrage + price : avrage - price;

  let tolerence = (await setting.get("TOLERENCE")) as number;

  let margin = is_sell ? price + tolerence : price - tolerence;

  await prisma.auction.update({
    where: { user_id },
    data: {
      is_sell,
      price,
      margin,
      is_triggered: false,
    },
  });

  //   TODO check for auction
}
