import { User } from "@prisma/client";
import { subscriptionField } from "nexus";
import { pubsub } from "../../services/pubsub";

export const newUsers = subscriptionField("newUsers", {
  type: "User",
  subscribe: () => pubsub.asyncIterator("newUsers"),
  resolve: (payload: User) => payload,
});
