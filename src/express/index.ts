import { sessionMiddleware } from "./session";
import passport from "passport";

export const passportMiddleware = passport.initialize();
export const passportSessionMiddleware = passport.session();

import express from "express";
import { beamsAuth } from "../services/pushNotifications";

const app = express();

app.use(sessionMiddleware);
app.use(passportMiddleware);
app.use(passportSessionMiddleware);

app.get("/pusher/beams-auth", beamsAuth);

export default app;
