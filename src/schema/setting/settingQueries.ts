import { objectType, queryField } from "nexus";
import setting from "../../services/setting";

export const Settings = objectType({
  name: "Settings",
  definition(t) {
    t.nullable.int("BASE_CHARGE");
    t.nullable.int("VIP_OFF");
    t.nullable.boolean("GIFT_ON_SIGNUP");
    t.nullable.boolean("GIFT_ON_FIRSTCHARGE");
    t.nullable.boolean("TARADING_ACTIVATED");
    t.nullable.int("QUOTATION");
    t.nullable.int("COMMITION");
  },
});

export const getSettings = queryField("getSettings", {
  type: "Settings",
  resolve: async (_, args, context) => {
    let settings = await setting.getAll();
    return (settings);
  },
});
