import { intArg, mutationField, nonNull } from "nexus";
import { Context } from "../context";

export const verifyUser = mutationField("verifyUser", {
  type: "ActionResult",
  args: {
    user_id: nonNull(intArg()),
  },
  resolve: async (parent, args, context: Context) => {
    await context.prisma.user.update({
      where: { id: args.user_id },
      data: { verified: true },
    });

    return { success: true };
  },
});

export const changeUserRole = mutationField("changeUserRole", {
  type: "ActionResult",
  args: {
    user_id: nonNull(intArg()),
    role: nonNull("UserRole"),
  },
  resolve: async (parent, { user_id, role }, context: Context) => {
    await context.prisma.user.update({
      where: { id: user_id },
      data: { role: role },
    });

    return { success: true };
  },
});

export const changeUserVipSettings = mutationField("changeUserVipSettings", {
  type: "ActionResult",
  args: {
    user_id: nonNull(intArg()),
    vip_off: nonNull(intArg()),
    base_charge: nonNull(intArg()),
  },
  resolve: async (
    parent,
    { user_id, vip_off, base_charge },
    context: Context,
  ) => {
    await context.prisma.chargeinfo.update({
      where: { id: user_id },
      data: { vip_off, base_charge },
    });

    return { success: true };
  },
});
