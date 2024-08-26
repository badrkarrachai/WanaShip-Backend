import { Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../../models/users_model";
import Image from "../../models/image_model";
import { generateToken } from "../../utils/jwt";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/response_handler";
import config from "../../config";
import bcrypt from "bcrypt";

// Configure Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: `${config.app.baseUrl}${config.app.apiPrefix}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        let user = await User.findOne({ email }).populate("avatar");

        if (user) {
          // Update existing user
          user.googleId = profile.id;
          user.name = user.name || profile.displayName;
          user.emailVerified = true;
          user.authProvider = "google";

          // Update avatar if not set
          if (!user.avatar && profile.photos?.[0]?.value) {
            const newAvatar = new Image({
              name: `${user.name}'s avatar`,
              url: profile.photos[0].value,
            });
            const savedAvatar = await newAvatar.save();
            user.avatar = savedAvatar.id;
          }

          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          user.tokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now

          await user.save();
        } else {
          // Create new user
          let newAvatar;
          if (profile.photos?.[0]?.value) {
            newAvatar = new Image({
              name: `${profile.displayName}'s avatar`,
              url: profile.photos[0].value,
            });
            newAvatar = await newAvatar.save();
          }

          const randomPassword = await generateRandomPassword();
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          user = new User({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            emailVerified: true,
            avatar: newAvatar ? newAvatar._id : undefined,
            password: hashedPassword,
            authProvider: "google",
            accessToken: accessToken,
            refreshToken: refreshToken,
            tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleAuthCallback = (req: Request, res: Response) => {
  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err) {
      console.error("Google authentication error:", err);
      return sendErrorResponse({
        res,
        message: "Authentication failed",
        errorCode: "AUTH_FAILED",
        errorDetails: "An error occurred during Google authentication",
        status: 500,
      });
    }

    if (!user) {
      return sendErrorResponse({
        res,
        message: "Authentication failed",
        errorCode: "AUTH_FAILED",
        errorDetails: "Unable to authenticate with Google",
        status: 401,
      });
    }

    try {
      const token = generateToken(user.id, user.role);

      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
          ? {
              id: user.avatar.id,
              url: user.avatar.url,
            }
          : null,
        isActivated: user.isActivated,
        preferences: user.preferences,
        notificationSettings: user.notificationSettings,
        authProvider: user.authProvider,
      };

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      sendSuccessResponse({
        res,
        message: "Google authentication successful",
        data: {
          token,
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

// Helper function to generate a random password
async function generateRandomPassword(): Promise<string> {
  const length = 16;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}
