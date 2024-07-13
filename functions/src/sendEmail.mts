import nodemailer from 'nodemailer'
import { HttpStatusCode } from '@/utils/index.mts';
import { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';

export const handler : Handler = async (event: HandlerEvent) : Promise<HandlerResponse> => {
  console.log("info: start sending mail.");
  console.time("SendEmail");
  const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_ACCOUNT,
      pass: process.env.EMAIL_PASSWORD,
    }
  })

  const body = JSON.parse(event?.body ?? "{}")
  const info = await transport.sendMail({
    from: process.env.EMAIL_ACCOUNT,
    to: process.env.EMAIL_ACCOUNT,
    subject: body?.subject ?? "",
    text: body?.text ?? "",
  })
  console.log(`Message sent: %s`, info.response);
  console.timeEnd("SendEmail");

  return {
    statusCode: HttpStatusCode.OK_200,
    body: "info: Sending email completed."
  }
}