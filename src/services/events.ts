import {
  Auction,
  Blockresult,
  Chargeinfo,
  Notification,
  Offer,
  Settleresult,
  Transaction,
  User,
} from "@prisma/client";
import EventEmitter from "events";
import { Server } from "socket.io";
import { notifyAdmins, notifyAll, notifyUser } from "./notification";
import { Setting, SETTINGS } from "./setting";

export const emmiter = new EventEmitter();

/**
 * events:
 *      newUser         (User)
 *      newPrice        (number)
 *      auctionMargin   (Auction)
 *      auctionHit      (Auction)
 *      auction         (Auction)
 *      newCharge       (Chargeinfo)
 *      charge          (Transaction)
 *      chargeRequest   (Transaction)
 *      settle          (Settleresult)
 *      block           (Blockresult)
 *      offer           (Offer)
 *      notification    (Notification)
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
  emmiter.on("/auction", (item: Auction) => {
    io.to(`/auction/${item.user_id}`).emit("/auction", item);
  });
  emmiter.on("/newCharge", (item: Chargeinfo) => {
    io.to(`/newCharge/${item.user_id}`).emit("/newCharge", item);
  });
  emmiter.on("/notification", (item: Notification) => {
    io.to(`/notification/${item.user_id}`).emit("/notification", item);
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

export const notificationHandler = (io: Server) => {
  emmiter.on("newUser", (user: User) => {
    notifyAdmins("A new user has registered", "/users");
  });
  emmiter.on("/chargeRequest", (item: Transaction) => {
    notifyAdmins("A new charge request has been sent", "/transactions");
  });
  emmiter.on("/auctionMargin", (item: Auction) => {
    notifyUser(item.user_id!, "market price has gotten near margin");
  });
  emmiter.on("/auctionHit", (item: Auction) => {
    notifyUser(
      item.user_id!,
      "market price has hit your margin. your trades are auctioned"
    );
  });
  emmiter.on("/charge", (item: Transaction) => {
    notifyUser(
      item.user_id!,
      "your transaction has been updated",
      "/transactions"
    );
  });
  emmiter.on("/settle", (item: Settleresult) => {
    notifyUser(item.user_id!, "market has been settled", "/settles");
  });
  emmiter.on("/block", (item: Blockresult) => {
    notifyUser(item.user_id!, "daily block has been occured", "/blocks");
  });
  emmiter.on("/setting", (item: [SETTINGS, Setting]) => {
    if (item[0] == "TARADING_ACTIVATED") {
      if (item[1] as boolean) {
        notifyAll("trading platform activated", "/");
      } else {
        notifyAll("trading platform closed", "/");
      }
    }
  });
};
