import { Bill, Chargeinfo } from ".prisma/client";
import { prisma } from "../../services/db";
import setting from "../../services/setting";
import R from "ramda";
import { Decimal } from "@prisma/client/runtime";

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

  let left_amount = R.reduce(
    (amount: number, elem: Bill) => {
      return amount + elem.left_amount!;
    },
    0,
    bills,
  );

  left_amount += R.reduce(
    (amount: number, elem) => {
      return amount + elem.left_amount!;
    },
    0,
    offers,
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
