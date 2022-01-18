import { RequestHandler, Router } from "express";
import { doBlock, getBlockResults, getBlocks } from "../../services/block";
import { doSettle, getSettleResults, getSettles } from "../../services/settle";
import {
  cancelOffer,
  getBills,
  getCommitions,
  getDeals,
  getOffers,
  makeOffer,
  trade,
} from "../../services/trade";
import { AdminOnly } from "./auth";

const block: RequestHandler = async (req, res) => {
  try {
    await doBlock(req.user?.id!);
    res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const blocks: RequestHandler = async (req, res) => {
  try {
    let result = await getBlocks(
      req.body.sort,
      req.body.paginate,
      req.body.page,
      req.body.perPage
    );
    return res.send(result);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const blockresults: RequestHandler = async (req, res) => {
  try {
    let result = await getBlockResults(
      req.body.userId,
      req.body.sort,
      req.body.paginate,
      req.body.page,
      req.body.perPage
    );
    return res.send(result);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const settle: RequestHandler = async (req, res) => {
  try {
    await doSettle(req.user?.id!, req.body.price);
    res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const settles: RequestHandler = async (req, res) => {
  try {
    let result = await getSettles(
      req.body.sort,
      req.body.paginate,
      req.body.page,
      req.body.perPage
    );
    return res.send(result);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const settleresults: RequestHandler = async (req, res) => {
  try {
    let result = await getSettleResults(
      req.body.userId,
      req.body.sort,
      req.body.paginate,
      req.body.page,
      req.body.perPage
    );
    return res.send(result);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const offer: RequestHandler = async (req, res) => {
  try {
    await makeOffer(
      req.user?.id!,
      req.body.amount,
      req.body.price,
      req.body.is_sell
    );
    res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const cancel: RequestHandler = async (req, res) => {
  try {
    await cancelOffer(req.user?.id!, req.body.offer_id);
    res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const doTrade: RequestHandler = async (req, res) => {
  try {
    await trade(req.user?.id!, req.body.offer_id, req.body.amount);
    res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const offers: RequestHandler = async (req, res) => {
  try {
    let result = await getOffers(
      req.body.is_expired,
      req.body.sort,
      req.body.paginate,
      req.body.page,
      req.body.perPage
    );
    return res.send(result);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const bills: RequestHandler = async (req, res) => {
  try {
    let result = await getBills(
      req.body.userId,
      req.body.settle_id,
      req.body.is_sell,
      req.body.is_settled,
      req.body.is_open,
      req.body.sort,
      req.body.paginate,
      req.body.page,
      req.body.perPage
    );
    return res.send(result);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const deals: RequestHandler = async (req, res) => {
  try {
    let result = await getDeals(
      req.body.userId,
      req.body.settle_id,
      req.body.is_sell,
      req.body.is_settled,
      req.body.sort,
      req.body.paginate,
      req.body.page,
      req.body.perPage
    );
    return res.send(result);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};
const commitions: RequestHandler = async (req, res) => {
  try {
    let result = await getCommitions(
      req.body.userId,
      req.body.settle_id,
      req.body.is_settled,
      req.body.sort,
      req.body.paginate,
      req.body.page,
      req.body.perPage
    );
    return res.send(result);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const router = Router();

router.post("/offers", AdminOnly, offers);
router.post("/bills", AdminOnly, bills);
router.post("/deals", AdminOnly, deals);
router.post("/commitions", AdminOnly, commitions);
router.post("/settles", AdminOnly, settles);
router.post("/settleresults", AdminOnly, settleresults);
router.post("/blocks", AdminOnly, blocks);
router.post("/blockresults", AdminOnly, blockresults);
router.post("/settle", AdminOnly, settle);
router.post("/block", AdminOnly, block);
router.post("/cancel", cancel);
router.post("/offer", offer);
router.post("/trade", doTrade);

export default router;
