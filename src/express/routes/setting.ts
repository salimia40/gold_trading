import { RequestHandler, Router } from "express";
import setting from "../../services/setting";
import { AdminOnly } from "./auth";

const set_BASE_CHARGE: RequestHandler = async (req, res) => {
  try {
    await setting.set("BASE_CHARGE", req.body.value);
    return res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const set_VIP_OFF: RequestHandler = async (req, res) => {
  try {
    await setting.set("VIP_OFF", req.body.value);
    return res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const set_TARADING_ACTIVATED: RequestHandler = async (req, res) => {
  try {
    await setting.set("TARADING_ACTIVATED", req.body.value);
    return res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const set_QUOTATION: RequestHandler = async (req, res) => {
  try {
    await setting.set("QUOTATION", req.body.value);
    return res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const set_TOLERENCE: RequestHandler = async (req, res) => {
  try {
    await setting.set("TOLERENCE", req.body.value);
    return res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const set_COMMITION: RequestHandler = async (req, res) => {
  try {
    await setting.set("COMMITION", req.body.value);
    return res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const set_DISCHARGE_ACTIVATED: RequestHandler = async (req, res) => {
  try {
    await setting.set("DISCHARGE_ACTIVATED", req.body.value);
    return res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const set_OFFER_AGE: RequestHandler = async (req, res) => {
  try {
    await setting.set("OFFER_AGE", req.body.value);
    return res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const set_OFFER_EXPIRE: RequestHandler = async (req, res) => {
  try {
    await setting.set("OFFER_EXPIRE", req.body.value);
    return res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};
const get: RequestHandler = async (req, res) => {
  try {
    let result = await setting.getAll();
    return res.send(result);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const router = Router();

router.post("/BASE_CHARGE", AdminOnly, set_BASE_CHARGE);
router.post("/COMMITION", AdminOnly, set_COMMITION);
router.post("/DISCHARGE_ACTIVATED", AdminOnly, set_DISCHARGE_ACTIVATED);
router.post("/OFFER_AGE", AdminOnly, set_OFFER_AGE);
router.post("/OFFER_EXPIRE", AdminOnly, set_OFFER_EXPIRE);
router.post("/QUOTATION", AdminOnly, set_QUOTATION);
router.post("/TARADING_ACTIVATED", AdminOnly, set_TARADING_ACTIVATED);
router.post("/TOLERENCE", AdminOnly, set_TOLERENCE);
router.post("/VIP_OFF", AdminOnly, set_VIP_OFF);

router.get("/", get);

export default router;
