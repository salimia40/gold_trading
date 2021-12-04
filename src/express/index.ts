import { sessionMiddleware } from "./session";
import passport from "passport";

export const passportMiddleware = passport.initialize();
export const passportSessionMiddleware = passport.session();

import express from "express";

const app = express();

app.use(sessionMiddleware);
app.use(passportMiddleware);
app.use(passportSessionMiddleware);

export default app;
