import "dotenv/config";
import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

try {
  await transporter.verify();
  console.log("SMTP verification succeeded.");
} catch (error) {
  console.log(`SMTP verification failed (${error.code || error.name}): ${error.message}`);
  process.exitCode = 1;
}
