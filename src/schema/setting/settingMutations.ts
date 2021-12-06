import { booleanArg, intArg, mutationField, nullable } from "nexus";
import setting from "../../services/setting";

export const updateSettings = mutationField("updateSettings", {
  type: "Settings",
  args: {
    "BASE_CHARGE": nullable(intArg()),
    "VIP_OFF": nullable(intArg()),
    "GIFT_ON_SIGNUP": nullable(booleanArg()),
    "GIFT_ON_FIRSTCHARGE": nullable(booleanArg()),
    "TARADING_ACTIVATED": nullable(booleanArg()),
    "QUOTATION": nullable(intArg()),
    "COMMITION": nullable(intArg()),
  },
  resolve: async (
    _,
    {
      BASE_CHARGE,
      VIP_OFF,
      GIFT_ON_FIRSTCHARGE,
      GIFT_ON_SIGNUP,
      TARADING_ACTIVATED,
      QUOTATION,
      COMMITION,
    },
    constext,
  ) => {
    if (BASE_CHARGE != null) {
      await setting.set("BASE_CHARGE", BASE_CHARGE!);
    }
    if (VIP_OFF != null) {
      await setting.set("VIP_OFF", VIP_OFF!);
    }
    if (GIFT_ON_FIRSTCHARGE != null) {
      await setting.set("GIFT_ON_FIRSTCHARGE", GIFT_ON_FIRSTCHARGE!);
    }
    if (GIFT_ON_SIGNUP != null) {
      await setting.set("GIFT_ON_SIGNUP", GIFT_ON_SIGNUP!);
    }
    if (TARADING_ACTIVATED != null) {
      await setting.set("TARADING_ACTIVATED", TARADING_ACTIVATED!);
    }
    if (QUOTATION != null) {
      await setting.set("QUOTATION", QUOTATION!);
    }
    if (COMMITION != null) {
      await setting.set("COMMITION", COMMITION!);
    }

    let settings = await setting.getAll();
    return settings;
  },
});
