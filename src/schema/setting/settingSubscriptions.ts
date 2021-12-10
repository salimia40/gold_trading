import { User } from "@prisma/client";
import { subscriptionField } from "nexus";
import { pubsub } from "../../services/pubsub";

export const settings = subscriptionField("settings", {
  type: "Settings",
  subscribe: () => pubsub.asyncIterator("settings"),
  // @ts-ignore
  resolve: (payload) => payload,
});
