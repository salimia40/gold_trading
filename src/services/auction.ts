import { prisma } from "./db";
import { filter, forEach, reduce } from "p-iteration";
import setting from "./setting";
import * as R from "ramda";

import { pipe, Subject } from "rxjs";
import { Auction } from ".prisma/client";

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
  await checkAuction(user_id);
}

export const priceEvent = new Subject<number>();

priceEvent.subscribe({
  next: (price) => {
    var min = price - 10;
    var max = price + 10;

    prisma.auction.findMany().then(
      pipe(
        (auctions) =>
          R.filter(
            (auction: Auction) =>
              !auction?.is_triggered && auction.margin != 0 &&
              auction.price != 0,
            auctions,
          ),
        (auctions) =>
          R.filter(
            (auction: Auction) =>
              (auction.is_sell && auction?.margin! <= max) ||
              (!auction.is_sell && auction?.margin! >= min),
            auctions,
          ),
        (auctions) => {
          // TODO alarm user
          return auctions;
        },
        (auctions) =>
          R.filter(
            (auction: Auction) =>
              (auction.is_sell && auction?.margin! <= price) ||
              (!auction.is_sell && auction?.margin! >= price),
            auctions,
          ),
        (auctions) =>
          forEach(auctions, async (auction) => {
            let bills = await prisma.bill.findMany({
              where: {
                user_id: auction.user_id,
                is_sell: auction.is_sell,
                is_settled: false,
                left_amount: { gt: 0 },
              },
            });
            let amount = await reduce(bills, (acc, bill) =>
              acc + bill.left_amount!, 0);

            if (amount > 0) {
              // TODO alarm user

              await prisma.offer.create({
                data: {
                  user_id: auction.user_id,
                  total_amount: amount,
                  left_amount: amount,
                  price: auction.price,
                  condition: "auction",
                  is_sell: !auction.is_sell,
                  is_expired: false,
                },
              });

              await prisma.auction.update({
                where: {
                  id: auction.id,
                },
                data: {
                  is_triggered: true,
                },
              });
            }
          }),
      ),
    );
  },
});

async function checkAuction(user_id: number) {
  const auction = await prisma.auction.findUnique({ where: { user_id } });
  const price = (await setting.get("QUOTATION")) as number;
  var min = price - 10;
  var max = price + 10;
  if (
    (auction?.is_sell && auction?.margin! <= max) ||
    (!auction?.is_sell && auction?.margin! >= min)
  ) {
    // TODO alarm user
  }
  if (
    (auction?.is_sell && auction?.margin! <= price) ||
    (!auction?.is_sell && auction?.margin! >= price)
  ) {
    let bills = await prisma.bill.findMany({
      where: {
        user_id: auction!.user_id,
        is_sell: auction!.is_sell,
        is_settled: false,
        left_amount: { gt: 0 },
      },
    });
    let amount = await reduce(bills, (acc, bill) => acc + bill.left_amount!, 0);

    if (amount > 0) {
      // TODO alarm user

      await prisma.offer.create({
        data: {
          user_id: auction?.user_id!,
          total_amount: amount,
          left_amount: amount,
          price: auction?.price!,
          condition: "auction",
          is_sell: !auction?.is_sell!,
          is_expired: false,
        },
      });

      await prisma.auction.update({
        where: {
          id: auction?.id,
        },
        data: {
          is_triggered: true,
        },
      });
    }
  }
}
