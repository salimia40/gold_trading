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

import path from "path";
import { put } from "../../services/storage";
import { nanoid } from "nanoid";

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

    let ext = path.extname(filename);
    let file = nanoid() + ext;

    await put("documents", file, stream);

    let doc = await context.prisma.document.create({
      data: {
        user_id: context.getUser()?.id!,
        file: file,
        file_type: "image",
      },
    });

    await context.prisma.transaction.create({
      data: {
        user_id: context.getUser()?.id!,
        document_id: doc.id,
        amount: amount,
        amount_text: amount_text,
        is_confirmed: false,
        is_done: false,
        transaction_type: "charge",
      },
    });

    return { success: true };
  },
});

export const dischargeRequest = mutationField("dischargeRequest", {
  type: "ActionResult",
  args: {
    amount: nonNull(intArg()),
    amount_text: nonNull(stringArg()),
  },
  resolve: async (_, { amount, amount_text }, context) => {
    const chargeinfo = await context.prisma.chargeinfo.findUnique({
      where: { user_id: context.getUser()?.id! },
    });
    if ((chargeinfo?.charge.lt(amount))) {
      return { success: false, error: "amount exeeds user charge" };
    }

    await context.prisma.transaction.create({
      data: {
        user_id: context.getUser()?.id!,
        amount: amount,
        amount_text: amount_text,
        is_confirmed: false,
        is_done: false,
        transaction_type: "discharge",
      },
    });

    return { success: true };
  },
});
