// src/loaders/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/users_model";
import Image from "../models/image_model";
import config from "../config";

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

            // Update avatar if not set
            if (!user.avatar && profile.photos?.[0]?.value) {
              const newAvatar = new Image({
                name: `${user.name}'s avatar`,
                url: profile.photos[0].value,
              });
              const savedAvatar = await newAvatar.save();
              user.avatar = savedAvatar.id;
            }

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

            user = new User({
              name: profile.displayName,
              email: email,
              googleId: profile.id,
              emailVerified: true,
              avatar: newAvatar ? newAvatar._id : undefined,
              password: await generateRandomPassword(), // Implement this function
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

  // Helper function to generate a random password
  async function generateRandomPassword(): Promise<string> {
    const length = 16;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
