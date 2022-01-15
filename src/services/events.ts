import EventEmitter from "events";

export const emmiter = new EventEmitter()

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
 */