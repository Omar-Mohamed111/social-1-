import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../../lib/config/env";

export class NodemailerProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.nodemailer.user,
        pass: env.nodemailer.pass,
      },
    });
  }

  sendEmail = async (
    to: string,
    subject: string,
    html: string,
  ): Promise<void> => {
    await this.transporter.sendMail({
      from: `"Social-App" <${env.nodemailer.user}>`,
      to,
      subject,
      html,
    });
  };
}

export default new NodemailerProvider();
