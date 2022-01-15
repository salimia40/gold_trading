import nodemailer, { Transporter } from "nodemailer";

var transporter: Transporter;
export async function init() {
  if (process.env.env == "DEVELOPMENT") {
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }
}

export async function sendMail(
  to: string,
  subject: string,
  text: string | undefined = undefined,
  html: string | undefined = undefined
) {
  console.info(`mailto:${to} \tmessage:${text},${html}`);

  await transporter?.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to, // list of receivers
    subject, // Subject line
    text, // plain text body
    html, // html body
  });
}
