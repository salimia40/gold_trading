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
