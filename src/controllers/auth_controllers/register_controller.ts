import { Request, Response } from "express";
import User from "../../models/users";
import bcrypt from "bcrypt";
import validator from "validator";
import { sendEmail } from "../../utils/email";
import { readHtmlTemplate } from "../../utils/read_html";
import { generateToken } from "../../utils/jwt";
import config from "../../config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/response_handler";
import { body, validationResult } from "express-validator";
import {
  registrationValidationRules,
  validateRequest,
} from "../../utils/validations";

// Registration with email verification false
export const register = async (req: Request, res: Response) => {
  try {
    let messagesForUser: string[] = [];

    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      registrationValidationRules
    );
    if (validationErrors !== "validation successful") {
      return sendErrorResponse({
        res,
        message: "Invalid input",
        errorCode: "INVALID_INPUT",
        errorDetails: validationErrors,
        status: 400,
      });
    }

    const { name, email, password } = req.body;
    const sanitizedEmail = validator.normalizeEmail(email) || "";
    const sanitizedName = validator.escape(name);

    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return sendErrorResponse({
        res,
        message: "User already exists",
        errorCode: "USER_ALREADY_EXISTS",
        errorDetails: "A user with this email address is already registered.",
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

    const newUser = new User({
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
    });

    await newUser.save();

    // check is user email verified
    if (!newUser.emailVerified) {
      messagesForUser.push(`Please verify your email to use full features.`);
    }

    await sendWelcomeEmail(existingUser);

    const userData = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      isActivated: newUser.isActivated,
      preferences: newUser.preferences,
      notificationSettings: newUser.notificationSettings,
      messages: messagesForUser,
    };

    const token = generateToken(newUser.id, newUser.role);

    return sendSuccessResponse({
      res,
      message: "registration successful",
      data: { token, user: userData },
      status: 201,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return sendErrorResponse({
      res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails: "An unexpected error occurred. Please try again later.",
      status: 500,
    });
  }
};

async function sendWelcomeEmail(user: any) {
  let htmlTemplate = readHtmlTemplate("welcome_to.html");
  htmlTemplate = htmlTemplate.replace("{{NAME}}", user.name);

  await sendEmail({
    to: user.email,
    subject: `Welcome to ${config.app.appName}!`,
    html: htmlTemplate,
    text: "",
  });
}
