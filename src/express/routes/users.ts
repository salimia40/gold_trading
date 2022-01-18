import { RequestHandler, Router } from "express";
import {
  changeUserRole,
  changeUserVipSettings,
  chargeUser,
  confirmTransaction,
  declineTransaction,
  doTransaction,
  getAvatar,
  getTransactions,
  getUser,
  getUsers,
  verifyUser,
} from "../../services/user";
import { AdminOnly, verifiedOnly } from "./auth";

const verify: RequestHandler = async (req, res) => {
  const { userId } = req.body;
  await verifyUser(userId);
  res.sendStatus(200);
};

const updateRole: RequestHandler = async (req, res) => {
  const { userId, role } = req.body;
  await changeUserRole(userId, role);
  res.sendStatus(200);
};

const updateVipSettings: RequestHandler = async (req, res) => {
  const { userId, vip_off, base_charge } = req.body;
  await changeUserVipSettings(userId, vip_off, base_charge);
  res.sendStatus(200);
};

const charge: RequestHandler = async (req, res) => {
  const { userId, is_charge, amount } = req.body;
  try {
    await chargeUser(req.user?.id!, userId, is_charge, amount);
    res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const confirm: RequestHandler = async (req, res) => {
  const { transaction_id } = req.body;
  try {
    await confirmTransaction(transaction_id);
    res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const done: RequestHandler = async (req, res) => {
  const { transaction_id } = req.body;
  try {
    await doTransaction(transaction_id);
    res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const decline: RequestHandler = async (req, res) => {
  const { transaction_id } = req.body;
  try {
    await declineTransaction(transaction_id);
    res.sendStatus(200);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const transactions: RequestHandler = async (req, res) => {
  const {
    userId,
    is_done,
    is_confiremd,
    transaction_type,
    sort,
    paginate,
    page,
    perPage,
  } = req.body;
  const result = await getTransactions(
    userId,
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

const users: RequestHandler = async (req, res) => {
  const { role, verfied, sort, paginate, page, perPage } = req.body;
  const result = await getUsers(role, verfied, sort, paginate, page, perPage);
  res.send(result);
};

const user: RequestHandler = async (req, res) => {
  const { userId } = req.body;
  const result = await getUser(userId);
  res.send(result);
};

const avatar: RequestHandler = async (req, res) => {
  try {
    let result = await getAvatar(req.body.userId!);
    return res.send(result);
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

const router = Router();

router.post("/", users);
router.post("/user", user);
router.post("/avatar", avatar);
router.post("/transactions", transactions);
router.post("/transactions/decline", decline);
router.post("/transactions/confirm", confirm);
router.post("/transactions/done", done);
router.post("/transactions/charge", charge);
router.post("/transactions/update_vip", updateVipSettings);
router.post("/updateRole", updateRole);
router.post("/verify", verify);

export default router;
