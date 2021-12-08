import { Bill } from ".prisma/client";
import { prisma } from "../../services/db";
import setting from "../../services/setting";
import { forEach, reduce } from "p-iteration";
import { Decimal } from "@prisma/client/runtime";
import { countAuction } from "../../services/auction";
import { countBlock } from "../../services/block";
import { userCommition } from "../../services/user";

export async function hasSufficentCharge(user_id: number) {
  const chargeInfo = await prisma.chargeinfo.findUnique({
    where: {
      user_id,
    },
  });

  if (
    chargeInfo?.base_charge.gt(0)
  ) {
    if (chargeInfo.charge.lt(chargeInfo.base_charge)) {
      return false;
    }
  } else {
    let base_charge = await setting.get("BASE_CHARGE");
    if (chargeInfo?.charge.lt(base_charge as number)) {
      return false;
    }
  }
  return true;
}

export async function matchTolerance(price: number) {
  var tol = await setting.get("TOLERENCE") as number;
  var q = await setting.get("QUOTATION") as number;
  var min = q - tol;
  var max = q + tol;
  return (price >= min && price <= max);
}

export async function maxCanTrade(user_id: number) {
  const chargeInfo = await prisma.chargeinfo.findUnique({
    where: {
      user_id,
    },
  });

  const base_charge = chargeInfo?.base_charge.gt(0)
    ? chargeInfo?.base_charge
    : await setting.get("BASE_CHARGE") as number;

  var maximum = chargeInfo?.charge.dividedBy(base_charge).floor();

  const bills = await prisma.bill.findMany({
    where: {
      user_id,
      is_settled: false,
      left_amount: {
        gt: 0,
      },
    },
  });

  const offers = await prisma.offer.findMany({
    where: {
      user_id,
      is_expired: false,
      left_amount: {
        gt: 0,
      },
    },
  });

  let left_amount = await reduce(
    bills,
    (amount: number, elem: Bill) => {
      return amount + elem.left_amount!;
    },
    0,
  );

  left_amount += await reduce(
    offers,
    (amount: number, elem) => {
      return amount + elem.left_amount!;
    },
    0,
  );

  maximum = maximum?.sub(left_amount);
  if (maximum?.lt(0)) new Decimal(0);
  else return maximum;
}

export async function autoExpire(offer_id: number) {
  const expire = (await setting.get("OFFER_EXPIRE")) as boolean;
  if (expire) {
    const age = (await setting.get("OFFER_AGE")) as number;
    setTimeout(() => {
      prisma.offer.update({
        where: {
          id: offer_id,
        },
        data: {
          is_expired: true,
        },
      });
    }, age * 1000);
  }
}

async function makeDeals(bill: Bill) {
  let amount = bill.left_amount!;
  let price = bill.price!;
  let user_id = bill.user_id!;
  let is_sell = bill.is_sell!;

  let commitionFee = await userCommition(user_id);

  let bills = await prisma.bill.findMany({
    where: {
      user_id,
      is_sell: !bill.is_sell,
      is_settled: false,
      left_amount: { gt: 0 },
    },
  });

  let profit = 0;
  let commition = 0;

  await forEach(bills, async (_bill: Bill) => {
    if (amount == 0) {
      return;
    }
    let sold = (amount > _bill.left_amount!) ? _bill.left_amount! : amount;
    amount -= sold;

    let sell_price = is_sell ? price : _bill.price!;
    let buy_price = is_sell ? _bill.price! : price;
    let _priceDiff = sell_price - buy_price;
    let _profit = (_priceDiff * sold * 100) / 4.3318;
    let _commition = sold * commitionFee;

    profit += _profit;
    commition += -commition;

    await prisma.bill.update({
      where: {
        id: _bill.id!,
      },
      data: {
        left_amount: {
          decrement: sold,
        },
      },
    });

    await prisma.deal.create({
      data: {
        user_id,
        is_sell,
        amount: sold,
        sell_price,
        buy_price,
        profit: _profit,
        commition: _commition,
        condition: "normal",
      },
    });
  });

  return { profit, commition };
}

async function addCharge(user_id: number, charge: number) {
  if (charge < 0) {
    await prisma.chargeinfo.update({
      where: { user_id },
      data: {
        charge: {
          decrement: Math.abs(charge),
        },
      },
    });
  } else {
    await prisma.chargeinfo.update({
      where: { user_id },
      data: {
        charge: {
          increment: charge,
        },
      },
    });
  }
}

export async function processTrade(
  seller_id: number,
  buyer_id: number,
  price: number,
  amount: number,
  is_sell: boolean,
) {
  let user_id = is_sell ? seller_id : buyer_id;
  let sellerBill = await prisma.bill.create({
    data: {
      user_id,
      seller_id,
      buyer_id,
      is_sell,
      total_amount: amount,
      left_amount: amount,
      price,
      is_settled: false,
    },
  });

  let { profit, commition } = await makeDeals(sellerBill);

  if (commition > 0) {
    await prisma.commition.create({
      data: {
        user_id,
        amount: commition,
      },
    });
  }

  let charge = profit + commition;
  await addCharge(user_id, charge);

  await countAuction(user_id);
  await countBlock(user_id, is_sell);
}
