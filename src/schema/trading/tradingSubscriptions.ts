import { Offer } from "@prisma/client";
import { subscriptionField } from "nexus";
import { pubsub } from "../../services/pubsub";

export const offer = subscriptionField("offer", {
  type: "Offer",
  subscribe: () => pubsub.asyncIterator("offer"),
  resolve: (payload: Offer) => payload,
});
