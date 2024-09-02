import { Request, Response } from "express";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import User from "../../models/users_model";
import Image, { IImages } from "../../models/image_model";
import { prepareJWTTokensForAuth } from "../../utils/jwt_util";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/response_handler_util";
import config from "../../config";
import bcrypt from "bcrypt";
import { checkAccountRecoveryStatus } from "../../utils/account_deletion_check_util";
import { formatUserData } from "../../utils/responces_templates/user_auth_response_template";
import { Document } from "mongoose";
import { sendWelcomeEmail } from "../../utils/email_sender_util";

passport.use(
  new DiscordStrategy(
    {
      clientID: config.discord.clientID,
      clientSecret: config.discord.clientSecret,
      callbackURL: `${config.app.baseUrl}${config.app.apiPrefix}/auth/discord/callback`,
      scope: ["identify", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ discordId: profile.id });

        if (user) {
          // Update existing user
          user.name = user.name || profile.username;
          user.emailVerified = true;
          user.authProvider = "discord";
          user.lastLogin = new Date();

          if (!user.avatar && profile.avatar) {
            const newAvatar = new Image({
              userId: user.id, // Use id instead of id
              name: `${user.name}'s avatar`,
              url: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
            });
            const savedAvatar = (await newAvatar.save()) as IImages & Document;
            user.avatar = savedAvatar.id;
          }

          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          user.tokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now

          await user.save();
        } else {
          // Create new user
          const randomPassword = await bcrypt.hash(
            Math.random().toString(36),
            10
          );

          user = new User({
            name: profile.username,
            email: profile.email,
            discordId: profile.id,
            emailVerified: true,
            password: randomPassword,
            authProvider: "discord",
            accessToken: accessToken,
            refreshToken: refreshToken,
            tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
          });

          // Save the user first to get an id
          await user.save();

          if (profile.avatar) {
            const newAvatar = new Image({
              userId: user.id, // Now we have a valid id
              name: `${profile.username}'s avatar`,
              url: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
            });
            const savedAvatar = (await newAvatar.save()) as IImages & Document;
            user.avatar = savedAvatar.id;
            await user.save(); // Save again to update the avatar field
          }

          // Send welcome email to the user
          sendWelcomeEmail(user);
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export const discordAuth = passport.authenticate("discord");

export const discordAuthCallback = (req: Request, res: Response) => {
  passport.authenticate("discord", { session: false }, async (err, user) => {
    if (err) {
      console.error("Discord authentication error:", err);
      return sendErrorResponse({
        res,
        message: "Authentication failed",
        errorCode: "AUTH_FAILED",
        errorDetails: "An error occurred during Discord authentication",
        status: 500,
      });
    }

    if (!user) {
      return sendErrorResponse({
        res,
        message: "Authentication failed",
        errorCode: "AUTH_FAILED",
        errorDetails: "Unable to authenticate with Discord",
        status: 401,
      });
    }

    try {
      let messagesForUser: string[] = [];

      // Check if the account is activated
      if (!user.isActivated) {
        return sendErrorResponse({
          res: res,
          message: "Your account is disabled",
          errorCode: "ACCOUNT_DISABLED",
          errorDetails:
            "Account is not activated, please contact the support team.",
        });
      }

      // check is user email verified
      if (!user.emailVerified) {
        messagesForUser.push(`Please verify your email to use full features.`);
      }

      // Check if the account is deleted and if it's been more than config.app.recoveryPeriod days
      const recoveryMessage = checkAccountRecoveryStatus(
        user,
        config.app.recoveryPeriod,
        res
      );
      if (recoveryMessage === "deleted") {
        return sendErrorResponse({
          res: res,
          message: "Account has been permanently deleted",
          errorCode: "ACCOUNT_DELETED",
          errorDetails:
            "The recovery period has ended. Your account is scheduled for permanent deletion.",
          status: 403,
        });
      }
      if (recoveryMessage) {
        messagesForUser.push(recoveryMessage);
      }

      // Generate JWT tokens
      const accessToken = prepareJWTTokensForAuth(user, res);

      const userData = await formatUserData(user, messagesForUser);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      sendSuccessResponse({
        res,
        message: "Discord authentication successful",
        data: {
          accessToken,
          user: userData,
        },
        status: 200,
      });
    } catch (error) {
      console.error("Token generation error:", error);
      sendErrorResponse({
        res,
        message: "Authentication failed",
        errorCode: "AUTH_FAILED",
        errorDetails:
          "An error occurred while generating the authentication token",
        status: 500,
      });
    }
  })(req, res);
};
