import {
  Auction,
  Blockresult,
  Offer,
  Settleresult,
  Transaction,
  User,
} from "@prisma/client";
import EventEmitter from "events";
import { Server } from "socket.io";

export const emmiter = new EventEmitter();

/**
 * events:
 *      newUser         (User)
 *      newPrice        (number)
 *      auctionMargin   (Auction)
 *      auctionHit      (Auction)
 *      charge          (Transaction)
 *      chargeRequest   (Transaction)
 *      settle          (Settleresult)
 *      block           (Blockresult)
 *      offer           (Offer)
 *      setting         [setting , value]
 */

export const sockethHandler = (io: Server) => {
  emmiter.on("newUser", (user: User) => {
    io.to("/newUser").emit("/newUser", user);
  });
  emmiter.on("/chargeRequest", (item: Transaction) => {
    io.to("/chargeRequest").emit("/chargeRequest", item);
  });
  emmiter.on("/newPrice", (item: number) => {
    io.to("/newPrice").emit("/newPrice", item);
  });
  emmiter.on("/offer", (item: Offer) => {
    io.to("/offer").emit("/offer", item);
  });
  emmiter.on("/auctionMargin", (item: Auction) => {
    io.to(`/auctionMargin/${item.user_id}`).emit("/auctionMargin", item);
  });
  emmiter.on("/auctionHit", (item: Auction) => {
    io.to(`/auctionHit/${item.user_id}`).emit("/auctionHit", item);
  });
  emmiter.on("/auctionMargin", (item: Auction) => {
    io.to(`/auctionMargin/${item.user_id}`).emit("/auctionMargin", item);
  });
  emmiter.on("/charge", (item: Transaction) => {
    io.to(`/charge/${item.user_id}`).emit("/charge", item);
  });
  emmiter.on("/settle", (item: Settleresult) => {
    io.to(`/settle/${item.user_id}`).emit("/settle", item);
  });
  emmiter.on("/block", (item: Blockresult) => {
    io.to(`/block/${item.user_id}`).emit("/block", item);
  });
  emmiter.on("/setting", (item: []) => {
    io.to(`/setting`).emit("/setting", item);
  });
};
