import app from "./express";
import { init as initMail } from "./services/mail";

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});
initMail().then(() => {
  app.listen(4000);
});
