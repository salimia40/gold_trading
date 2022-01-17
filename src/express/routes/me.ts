import { RequestHandler, Router } from "express";
import { getBlockResults } from "../../services/block";
import { getSettleResults } from "../../services/settle";
import { getBills, getDeals } from "../../services/trade";
import { UploadedFile } from "express-fileupload";
import {
  chargeRequest,
  dischargeRequest,
  getTransactions,
  getUser,
} from "../../services/user";
import streamifier from "streamifier";
import path from "path";
import { verifiedOnly } from "./auth";

const me: RequestHandler = async (req, res) => {
  const userId = req.user?.id!;
  const result = await getUser(userId);
  res.send(result);
};

const myTransactions: RequestHandler = async (req, res) => {
  const {
    is_done,
    is_confiremd,
    transaction_type,
    sort,
    paginate,
    page,
    perPage,
  } = req.body;
  const result = await getTransactions(
    req.user?.id!,
    is_done,
    is_confiremd,
    transaction_type,
    sort,
    paginate,
    page,
    perPage
  );
  res.send(result);
};

const requestCharge: RequestHandler = async (req, res) => {
  const { amount, amount_text } = req.body;
  const document = req.files?.document! as UploadedFile;

  try {
    await chargeRequest(
      req.user?.id!,
      amount,
      amount_text,
      streamifier.createReadStream(document.data),
      path.extname(document.name)
    );
    res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const requestDischarge: RequestHandler = async (req, res) => {
  const { amount, amount_text } = req.body;
  try {
    await dischargeRequest(req.user?.id!, amount, amount_text);
    res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const myBlockresults: RequestHandler = async (req, res) => {
  try {
    let result = await getBlockResults(
      req.user?.id!,
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

const mySettleresults: RequestHandler = async (req, res) => {
  try {
    let result = await getSettleResults(
      req.user?.id!,
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

const myBills: RequestHandler = async (req, res) => {
  try {
    let result = await getBills(
      req.user?.id!,
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

const myDeals: RequestHandler = async (req, res) => {
  try {
    let result = await getDeals(
      req.user?.id!,
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

const router = Router();

router.post("/", me);
router.post("/transactions", myTransactions);
router.post("/transactions/requestDischarge", requestDischarge);
router.post("/transactions/requestCharge", requestCharge);
router.post("/bills", myBills);
router.post("/deals", myDeals);
router.post("/blocks", myBlockresults);
router.post("/settles", mySettleresults);

export default router;
