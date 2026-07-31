import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import User from "../models/User.js";

// We don't use passport sessions — auth state lives in our own JWT cookies.
// Passport here is only responsible for the OAuth handshake + profile fetch.

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ provider: "google", providerId: profile.id });

        if (!user) {
          // If someone previously signed up with the same email via another
          // provider, link accounts instead of creating a duplicate.
          user = await User.findOne({ email: profile.emails?.[0]?.value });
        }

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            avatar: profile.photos?.[0]?.value,
            provider: "google",
            providerId: profile.id,
          });
        } else if (!user.providerId) {
          user.provider = "google";
          user.providerId = profile.id;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/api/v1/auth/facebook/callback",
      profileFields: ["id", "displayName", "emails", "photos"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ provider: "facebook", providerId: profile.id });

        if (!user) {
          user = await User.findOne({ email: profile.emails?.[0]?.value });
        }

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            avatar: profile.photos?.[0]?.value,
            provider: "facebook",
            providerId: profile.id,
          });
        } else if (!user.providerId) {
          user.provider = "facebook";
          user.providerId = profile.id;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;