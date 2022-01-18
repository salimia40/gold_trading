import { Bill, User_role } from ".prisma/client";
import { prisma } from "./db";
import setting from "./setting";
import { forEach, reduce } from "p-iteration";
import { Decimal } from "@prisma/client/runtime";
import { countAuction } from "./auction";
import { countBlock } from "./block";
import { userCommition } from "./user";
import { Prisma } from "@prisma/client";
import { emmiter } from "./events";

export async function hasSufficentCharge(user_id: number) {
  const chargeInfo = await prisma.chargeinfo.findUnique({
    where: {
      user_id,
    },
  });

  if (chargeInfo?.base_charge.gt(0)) {
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
  var tol = (await setting.get("TOLERENCE")) as number;
  var q = (await setting.get("QUOTATION")) as number;
  var min = q - tol;
  var max = q + tol;
  return price >= min && price <= max;
}

export async function maxCanTrade(user_id: number, is_sell: boolean) {
  const chargeInfo = await prisma.chargeinfo.findUnique({
    where: {
      user_id,
    },
  });

  const base_charge = chargeInfo?.base_charge.gt(0)
    ? chargeInfo?.base_charge
    : ((await setting.get("BASE_CHARGE")) as number);

  var maximum = chargeInfo?.charge.dividedBy(base_charge).floor();

  const bills = await prisma.bill.findMany({
    where: {
      user_id,
      is_settled: false,
      is_sell,
      left_amount: {
        gt: 0,
      },
    },
  });

  const offers = await prisma.offer.findMany({
    where: {
      user_id,
      is_sell,
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
    0
  );

  left_amount += await reduce(
    offers,
    (amount: number, elem) => {
      return amount + elem.left_amount!;
    },
    0
  );

  maximum = maximum?.sub(left_amount);
  if (maximum?.lt(0)) new Decimal(0);
  else return maximum;
}

export async function autoExpire(offer_id: number) {
  const expire = (await setting.get("OFFER_EXPIRE")) as boolean;
  if (expire) {
    const age = (await setting.get("OFFER_AGE")) as number;
    setTimeout(async () => {
      let offer = await prisma.offer.update({
        where: {
          id: offer_id,
        },
        data: {
          is_expired: true,
        },
      });
      emmiter.emit("offer", offer);
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
    let sold = amount > _bill.left_amount! ? _bill.left_amount! : amount;
    amount -= sold;

    let sell_price = is_sell ? price : _bill.price!;
    let buy_price = is_sell ? _bill.price! : price;
    let _priceDiff = sell_price.minus(buy_price).toNumber();
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

  return { profit, commition, amount };
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
  is_sell: boolean
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

  console.log("making deals");
  let result = await makeDeals(sellerBill);
  let { profit, commition } = result;
  console.log("made deals");

  await prisma.bill.update({
    where: { id: sellerBill.id },
    data: { left_amount: result.amount },
  });

  if (commition > 0) {
    await prisma.commition.create({
      data: {
        user_id,
        amount: commition,
      },
    });
  }

  console.log("saved commmtion");

  let charge = profit + commition;
  await addCharge(user_id, charge);
  console.log("added charge");

  await countAuction(user_id);
  console.log("counted auction");
  await countBlock(user_id, is_sell);
  console.log("counted Block");
}

export async function settleTrade(
  user_id: number,
  price: number,
  amount: number,
  is_sell: boolean
) {
  let sellerBill = await prisma.bill.create({
    data: {
      user_id,
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
}

export async function getOffers(
  is_expired: boolean | null = null,
  sort: "asc" | "desc" = "asc",
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
  let query: Prisma.OfferFindManyArgs = {};
  let cQuery: Prisma.OfferCountArgs = {};

  if (is_expired != null) {
    query.where = {
      is_expired,
      left_amount: {
        gt: 0,
      },
    };
    cQuery.where = {
      is_expired,
      left_amount: {
        gt: 0,
      },
    };
  }
  if (sort != null) {
    query.orderBy = {
      created_at: sort,
    };
  }

  let totalPage: number = 1,
    total: number;
  total = await prisma.offer.count(cQuery);
  if (paginate) {
    perPage = perPage || 10;
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    query.skip = (page - 1) * perPage;
    query.take = perPage;
  }

  let offers = await prisma.offer.findMany(query);

  return {
    items: offers,
    page,
    total,
    totalPage,
    perPage,
  };
}

export async function getBills(
  user_id: number | null = null,
  settle_id: number | null = null,
  is_sell: boolean | null = null,
  is_settled: boolean | null = null,
  is_open: boolean | null = null,
  sort: "asc" | "desc" = "asc",
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
  let query: Prisma.BillFindManyArgs = {};
  let cQuery: Prisma.BillCountArgs = {};
  query.where = {};
  cQuery.where = {};

  if (user_id != null) {
    query.where.user_id = user_id;
    cQuery.where.user_id = user_id;
  }
  if (settle_id != null) {
    query.where.settle_id = settle_id;
    cQuery.where.settle_id = settle_id;
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

  let totalPage: number = 1,
    total: number;
  total = await prisma.bill.count(cQuery);
  if (paginate) {
    perPage = perPage || 10;
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    query.skip = (page - 1) * perPage;
    query.take = perPage;
  }

  let bills = await prisma.bill.findMany(query);

  return {
    items: bills,
    page,
    total,
    totalPage,
    perPage,
  };
}

export async function getDeals(
  user_id: number | null = null,
  settle_id: number | null = null,
  is_sell: boolean | null = null,
  is_settled: boolean | null = null,
  sort: "asc" | "desc" = "asc",
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
  let query: Prisma.DealFindManyArgs = {};
  let cQuery: Prisma.DealCountArgs = {};
  query.where = {};
  cQuery.where = {};

  if (user_id != null) {
    query.where.user_id = user_id;
    cQuery.where.user_id = user_id;
  }
  if (settle_id != null) {
    query.where.settle_id = settle_id;
    cQuery.where.settle_id = settle_id;
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

  let totalPage: number = 1,
    total: number;
  total = await prisma.deal.count(cQuery);
  if (paginate) {
    perPage = perPage || 10;
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    query.skip = (page - 1) * perPage;
    query.take = perPage;
  }

  let deals = await prisma.deal.findMany(query);

  return {
    items: deals,
    page,
    total,
    totalPage,
    perPage,
  };
}

export async function getCommitions(
  user_id: number | null = null,
  settle_id: number | null = null,
  is_settled: boolean | null = null,
  sort: "asc" | "desc" = "asc",
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
  let query: Prisma.CommitionFindManyArgs = {};
  let cQuery: Prisma.CommitionCountArgs = {};
  query.where = {};
  cQuery.where = {};

  if (user_id != null) {
    query.where.user_id = user_id;
    cQuery.where.user_id = user_id;
  }
  if (settle_id != null) {
    query.where.settle_id = settle_id;
    cQuery.where.settle_id = settle_id;
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

  let totalPage: number = 1,
    total: number;
  total = await prisma.commition.count(cQuery);
  if (paginate) {
    perPage = perPage || 10;
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    query.skip = (page - 1) * perPage;
    query.take = perPage;
  }

  let commitions = await prisma.commition.findMany(query);

  return {
    items: commitions,
    page,
    total,
    totalPage,
    perPage,
  };
}

export async function getPrices(
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
  let query: Prisma.PriceFindManyArgs = {};
  let cQuery: Prisma.PriceCountArgs = {};
  query.where = {};
  cQuery.where = {};

  let totalPage: number = 1,
    total: number;
  total = await prisma.price.count(cQuery);
  if (paginate) {
    perPage = perPage || 10;
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    query.skip = (page - 1) * perPage;
    query.take = perPage;
  }

  let prices = await prisma.price.findMany(query);

  return {
    items: prices,
    page,
    total,
    totalPage,
    perPage,
  };
}

export async function makeOffer(
  user_id: number,
  amount: number,
  price: number,
  is_sell: boolean
) {
  if (!(await hasSufficentCharge(user_id))) {
    throw Error("insufficent charge");
  }
  if (!(await matchTolerance(price))) {
    throw Error("out of tolerence price");
  }
  if ((await maxCanTrade(user_id, is_sell))?.lt(amount)) {
    throw Error("amount exeeds");
  }

  const offer = await prisma.offer.create({
    data: {
      user_id,
      total_amount: amount,
      left_amount: amount,
      price: price,
      condition: "normal",
      is_sell,
      is_expired: false,
    },
  });

  emmiter.emit("offer", offer);

  autoExpire(offer.id);
}

export async function cancelOffer(user_id: number, offer_id: number) {
  let offer = await prisma.offer.findUnique({ where: { id: offer_id } });
  const user = await prisma.user.findUnique({ where: { id: user_id } });
  if (
    user_id !== offer?.user_id &&
    user?.role !== User_role.owner &&
    user?.role !== User_role.admin
  ) {
    throw Error("only offer owner can cancel");
  }
  offer = await prisma.offer.update({
    where: {
      id: offer_id,
    },
    data: {
      is_expired: true,
    },
  });
  emmiter.emit("offer", offer);
}

export async function trade(user_id: number, amount: number, offer_id: number) {
  let offer = await prisma.offer.findUnique({
    where: { id: offer_id },
  });

  if (offer == null) throw Error("invalid offer");

  if (offer?.left_amount! < amount) throw Error("amount exeeds offer");

  if (offer?.is_expired) throw Error("offer expired");

  if (user_id == offer?.user_id) throw Error("cant trade with oneself");

  if (!(await hasSufficentCharge(user_id))) {
    throw Error("insufficent charge");
  }

  if ((await maxCanTrade(user_id, !offer?.is_sell))?.lt(amount))
    throw Error("amount exeeds charge");

  let price = offer?.price!;

  offer = await prisma.offer.update({
    where: { id: offer_id },
    data: {
      left_amount: { decrement: amount },
    },
  });

  emmiter.emit("offer", offer);

  let seller_id = offer?.is_sell ? offer.user_id : user_id;
  let buyer_id = offer?.is_sell ? user_id : offer?.user_id!;

  /**
   *  close deals
   *  update user charge
   *  recalculate auction
   *  check auction
   *  recalculate block
   */

  console.info(seller_id, buyer_id, price, amount);

  await processTrade(seller_id, buyer_id, price.toNumber(), amount, true);
  await processTrade(seller_id, buyer_id, price.toNumber(), amount, false);
}
