// src/loaders/passport.ts

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as DiscordStrategy } from "passport-discord";
import User from "../models/users_model";
import Image from "../models/image_model";
import config from "../config";
import bcrypt from "bcrypt";

export default function () {
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

            const randomPassword = Math.random().toString(36).slice(-8);
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
          let user = await User.findOne({ discordId: profile.id }).populate(
            "avatar"
          );

          if (user) {
            // Update existing user
            user.name = user.name || profile.username;
            user.emailVerified = true;
            user.authProvider = "discord";

            if (!user.avatar && profile.avatar) {
              const newAvatar = new Image({
                name: `${user.name}'s avatar`,
                url: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
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
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = new User({
              name: profile.username,
              email: profile.email,
              discordId: profile.id,
              emailVerified: true,
              password: hashedPassword,
              authProvider: "discord",
              accessToken: accessToken,
              refreshToken: refreshToken,
              tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
            });

            if (profile.avatar) {
              const newAvatar = new Image({
                name: `${profile.username}'s avatar`,
                url: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
              });
              const savedAvatar = await newAvatar.save();
              user.avatar = savedAvatar.id;
            }

            await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}
