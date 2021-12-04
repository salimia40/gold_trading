import { enumType, objectType } from "nexus";

export const DealCondition = enumType({
  name: "DealCondition",
  members: ["normal", "auction", "settle"],
});

export const OfferCondition = enumType({
  name: "OfferCondition",
  members: ["normal", "auction"],
});

export const TransactionType = enumType({
  name: "TransactionType",
  members: [
    "charge",
    "discharge",
    "admin_charge",
    "admin_discharge",
    "gift",
  ],
});

export const UserRole = enumType({
  name: "UserRole",
  members: ["owner", "admin", "member", "vip"],
});

export const Auction = objectType({
  name: "Auction",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("user_id");
    t.nullable.int("margin");
    t.nullable.int("price");
    t.nonNull.boolean("is_triggered");
    t.nonNull.boolean("is_sell");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
  },
});
export const Bill = objectType({
  name: "Bill",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("user_id");
    t.nullable.int("price");
    t.nullable.int("total_amount");
    t.nullable.int("left_amount");
    t.nonNull.boolean("is_sell");
    t.nonNull.boolean("is_settled");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
  },
});
export const Block = objectType({
  name: "Block",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("user_id");
    t.nullable.int("amount");
    t.nonNull.boolean("is_sell");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
  },
});

export const Blockoperation = objectType({
  name: "Blockoperation",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("operator_id");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
  },
});

export const Blockresult = objectType({
  name: "Blockresult",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("user_id");
    t.nonNull.int("operator_id");
    t.nullable.int("commition");
    t.nonNull.boolean("is_sell");
    t.nonNull.boolean("is_settled");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
    t.nullable.field("blockoperation", { type: "Blockoperation" });
  },
});

export const Chargeinfo = objectType({
  name: "Chargeinfo",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("user_id");
    t.nullable.int("charge");
    t.nullable.int("base_charge");
    t.nullable.int("vip_off");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
  },
});

export const Commition = objectType({
  name: "Commition",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("user_id");
    t.nullable.int("amount");
    t.nonNull.boolean("is_settled");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
  },
});

export const Deal = objectType({
  name: "Deal",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("user_id");
    t.nullable.int("buy_price");
    t.nullable.int("sell_price");
    t.nullable.int("amount");
    t.nonNull.boolean("is_sell");
    t.nonNull.int("profit");
    t.nonNull.int("commition");
    t.nonNull.boolean("is_settled");
    t.nonNull.string("condition");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
  },
});

export const Document = objectType({
  name: "Document",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("user_id");
    t.nonNull.string("file");
    t.nonNull.string("file_type");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
  },
});

export const Gift = objectType({
  name: "Gift",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("user_id");
    t.nonNull.int("charge");
    t.nonNull.int("trigger");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
  },
});

export const Offer = objectType({
  name: "Offer",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("user_id");
    t.nullable.int("price");
    t.nullable.int("total_amount");
    t.nullable.int("left_amount");
    t.nonNull.boolean("is_sell");
    t.nonNull.boolean("is_expired");
    t.nonNull.string("condition");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
  },
});

export const Settle = objectType({
  name: "Settle",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("operator_id");
    t.nullable.int("price");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
    t.nullable.list.nullable.field("settleresults", { type: "SettleResult" });
  },
});

export const SettleResult = objectType({
  name: "SettleResult",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("operator_id");
    t.nullable.int("price");
    t.nullable.int("profit");
    t.nullable.int("commition");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
    t.nullable.field("settle", { type: "Settle" });
  },
});

export const Transaction = objectType({
  name: "Transaction",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("operator_id");
    t.nullable.int("price");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("user", { type: "User" });
    t.nullable.field("settle", { type: "Settle" });
  },
});

export const Refer = objectType({
  name: "Refer",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.int("user_id");
    t.nonNull.int("referer_id");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("referer", { type: "User" });
  },
});

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.int("id");
    t.nullable.string("username");
    t.nullable.string("email");
    t.nullable.string("name");
    t.nullable.string("role");
    t.nullable.string("phone");
    t.nullable.string("bank_name");
    t.nullable.string("bank_number");
    t.nonNull.string("refer_id");
    t.nonNull.boolean("accepted_terms");
    t.nonNull.boolean("verified");
    t.nonNull.date("created_at");
    t.nonNull.date("updated_at");
    t.nullable.field("auction", { type: "Auction" });
    t.nullable.field("chargeinfo", { type: "Chargeinfo" });
  },
});
