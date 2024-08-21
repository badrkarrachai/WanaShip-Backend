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
import { check, validationResult } from "express-validator";

export const register = async (req: Request, res: Response) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    // Validation
    await check("name", "Name is required")
      .not()
      .isEmpty()
      .isLength({ min: 2, max: 50 })
      .run(req);
    await check("email", "Please include a valid email")
      .isEmail()
      .isLength({ max: 250 })
      .run(req);
    await check(
      "password",
      "Password is required with a minimum length of 6 characters"
    )
      .isLength({ min: 6, max: 250 })
      .run(req);
    await check("confirmPassword", "Passwords do not match")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      })
      .run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorDetails = errors.array()[0].msg;
      return sendErrorResponse({
        res: res,
        message: "Invalid input",
        errorCode: "INVALID_INPUT",
        errorDetails: errorDetails,
        status: 400,
      });
    }

    // Initialize messages array
    let messagesForUser: string[] = [];

    // Sanitize inputs
    const sanitizedEmail = validator.normalizeEmail(email) || "";
    const sanitizedName = validator.escape(name);
    const sanitizedPassword = validator.escape(password);

    // Check if user already exists
    let user = await User.findOne({ email: sanitizedEmail });
    if (user) {
      return sendErrorResponse({
        res: res,
        message: "User already exists",
        errorCode: "USER_ALREADY_EXISTS",
        errorDetails: "A user with this email address is already registered",
        status: 400,
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(config.bcrypt.rounds);
    const hashedPassword = await bcrypt.hash(sanitizedPassword, salt);

    // Create new user
    user = new User({
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
      isActivated: true, // Direct activation
    });

    await user.save();

    // Send a welcome email
    let htmlTemplate = readHtmlTemplate("welcome_to.html");
    htmlTemplate = htmlTemplate.replace("{{NAME}}", user.name);

    sendEmail({
      to: user.email,
      subject: `Welcome to ${config.app.appName}!`,
      html: htmlTemplate,
      text: "",
    });

    // Prepare user data for response
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActivated: user.isActivated,
      preferences: user.preferences,
      notificationSettings: user.notificationSettings,
      messages: messagesForUser,
    };

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    // Send success response
    return sendSuccessResponse(
      {
        res: res,
        message: "User registered successfully",
        data: { token, user: userData },
        status: 201,
      } // HTTP status 201 for resource creation
    );
  } catch (err) {
    console.error("Registration error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails: "An unexpected error occurred during registration",
      status: 500,
    });
  }
};
