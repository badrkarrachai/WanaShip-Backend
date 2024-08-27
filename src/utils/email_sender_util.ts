import nodemailer from "nodemailer";
import config from "../config"; // Assume you have a config file with email settings

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Create a transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"${config.email.appName}" <${config.email.user}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email could not be sent");
  }
};
