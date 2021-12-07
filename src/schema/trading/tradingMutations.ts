import {
  booleanArg,
  floatArg,
  intArg,
  mutationField,
  nonNull,
  objectType,
} from "nexus";
import {
  autoExpire,
  hasSufficentCharge,
  matchTolerance,
  maxCanTrade,
  processTrade,
} from "./utils";

export const OfferPayload = objectType({
  name: "OfferPayload",
  definition(t) {
    t.nonNull.boolean("success");
    t.nullable.field("offer", { type: "Offer" });
    t.nullable.string("error");
  },
});

export const makeOffer = mutationField("makeOffer", {
  type: "OfferPayload",
  args: {
    is_sell: nonNull(booleanArg()),
    amount: nonNull(intArg()),
    price: nonNull(floatArg()),
  },
  resolve: async (_, { is_sell, amount, price }, context) => {
    /**
     * Validation steps
     *    price should match tolerence
     *    user charge must be more than base charge
     *    user account should be verified
     *    amount should be in range of maximum user can trade
     */
    const user_id = context.getUser()?.id!;
    if (!(await hasSufficentCharge(user_id))) {
      return {
        success: false,
        error: "insufficent charge",
      };
    }
    if (!(await matchTolerance(price))) {
      return {
        success: false,
        error: "out of tolerence price",
      };
    }
    if ((await maxCanTrade(user_id))?.lt(amount)) {
      return {
        success: false,
        error: "amount exeeds",
      };
    }

    const offer = await context.prisma.offer.create({
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

    autoExpire(offer.id);

    return { success: true, offer };
  },
});

export const cancelOffer = mutationField("cancelOffer", {
  type: "OfferPayload",
  args: {
    offer_id: nonNull(intArg()),
  },
  resolve: async (_, { offer_id }, context) => {
    const offer = await context.prisma.offer.update({
      where: {
        id: offer_id,
      },
      data: {
        is_expired: true,
      },
    });
    return { success: true, offer };
  },
});

export const trade = mutationField("trade", {
  type: "ActionResult",
  args: {
    amount: nonNull(intArg()),
    offer_id: nonNull(intArg()),
  },
  resolve: async (_, { offer_id, amount }, context) => {
    const user_id = context.getUser()?.id!;

    if (!(await hasSufficentCharge(user_id))) {
      return {
        success: false,
        error: "insufficent charge",
      };
    }
    if ((await maxCanTrade(user_id))?.lt(amount)) {
      return {
        success: false,
        error: "amount exeeds",
      };
    }

    const offer = await context.prisma.offer.findUnique({
      where: { id: offer_id },
    });

    if (offer?.left_amount! < amount) {
      return {
        success: false,
        error: "amount exeeds offer",
      };
    }
    if (offer?.is_expired) {
      return {
        success: false,
        error: "offer expired",
      };
    }
    if (user_id == offer?.user_id) {
      return {
        success: false,
        error: "cant trade with oneself",
      };
    }

    let price = offer?.price!;

    await context.prisma.offer.update({
      where: { id: offer_id },
      data: {
        left_amount: { decrement: amount },
      },
    });

    let seller_id = offer?.is_sell ? offer.user_id : user_id;
    let buyer_id = offer?.is_sell ? user_id : offer?.user_id!;

    /**
     *  close deals
     *  update user charge
     *  recalculate auction
     * // TODO check auction
     *  recalculate block
     */

    await processTrade(seller_id, buyer_id, price, amount, true);
    await processTrade(seller_id, buyer_id, price, amount, false);

    return { success: true };
  },
});
