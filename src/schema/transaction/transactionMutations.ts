import { Transaction_transaction_type } from ".prisma/client";
import {
  arg,
  booleanArg,
  floatArg,
  intArg,
  mutationField,
  nonNull,
  stringArg,
} from "nexus";

import fs from "fs";
import path from "path";

export const chargeUser = mutationField("chargeUser", {
  type: "ActionResult",
  args: {
    user_id: nonNull(intArg()),
    amount: nonNull(floatArg()),
    is_charge: nonNull(booleanArg()),
  },
  resolve: async (_, { user_id, amount, is_charge }, context) => {
    if (!is_charge) {
      const chargeinfo = await context.prisma.chargeinfo.findUnique({
        where: { user_id },
      });
      if ((chargeinfo?.charge.lt(amount))) {
        return { success: false, error: "amount exeeds user charge" };
      }

      await context.prisma.chargeinfo.update({
        where: { user_id },
        data: {
          charge: {
            decrement: amount,
          },
        },
      });
    } else {
      await context.prisma.chargeinfo.update({
        where: { user_id },
        data: {
          charge: {
            increment: amount,
          },
        },
      });
    }

    let transaction_type: Transaction_transaction_type = is_charge
      ? "admin_charge"
      : "admin_discharge";

    await context.prisma.transaction.create({
      data: {
        user_id: user_id,
        operator_id: context.getUser()?.id,
        transaction_type,
        is_done: true,
        is_confirmed: true,
        amount,
      },
    });

    return { success: true };
  },
});

export const chargeRequest = mutationField("chargeRequest", {
  type: "ActionResult",
  args: {
    document: nonNull(arg({ type: "Upload" })),
    amount: nonNull(intArg()),
    amount_text: nonNull(stringArg()),
  },
  resolve: async (_, { document, amount, amount_text }, context) => {
    const { createReadStream, filename } = await document;
    const stream = createReadStream();
    const pathname = path.join(__dirname, filename);
    stream.pipe(fs.createWriteStream(pathname));

    return { success: true };
  },
});
