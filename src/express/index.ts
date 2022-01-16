import express from "express";
import bodyparser from "body-parser";
import boom from "express-boom";
import authRouter, {
  AdminOnly,
  authenticateJWT,
  verifiedOnly,
} from "./routes/auth";
import userRouter from "./routes/users";
import meRouter from "./routes/me";
import tradeRouter from "./routes/trade";
import fileUpload from "express-fileupload";
import { createServer } from "http";
import createSocket from "./socket";
import { sockethHandler } from "../services/events";

const app = express();

app.use(bodyparser.json());
app.use(boom());
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
  })
);

app.use("/auth", authRouter);
app.use("/users", authenticateJWT, verifiedOnly, AdminOnly, userRouter);
app.use("/me", authenticateJWT, verifiedOnly, meRouter);
app.use("/trade", authenticateJWT, verifiedOnly, tradeRouter);

app.get("/", authenticateJWT, (req, res) => {
  res.send(req.user);
});

const httpServer = createServer(app);
const io = createSocket(httpServer);
sockethHandler(io);
export default httpServer;
