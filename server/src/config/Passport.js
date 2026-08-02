import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import User from "../models/User.js";

// We don't use passport sessions — auth state lives in our own JWT cookies.
// Passport here is only responsible for the OAuth handshake + profile fetch.

// Shared find-or-create logic for both providers.
// Deliberately matches ONLY by (provider, providerId) — never by email.
// If we matched by email instead, someone logging in with Google using the
// same email as a seeded/staff admin account would attach to that account
// and inherit its role. Keeping OAuth accounts fully separate from local
// staff accounts means OAuth logins can never reach elevated roles.
const findOrCreateOAuthUser = async (provider, profile) => {
  let user = await User.findOne({ provider, providerId: profile.id });

  if (!user) {
    user = await User.create({
      name: profile.displayName,
      email: profile.emails?.[0]?.value,
      avatar: profile.photos?.[0]?.value,
      provider,
      providerId: profile.id,
      role: "user", // explicit, even though it's also the schema default
    });
  }

  return user;
};

// Each strategy only registers if its credentials exist in .env — this lets
// the server start (and admin/staff login work) before OAuth apps are set up.
// The /auth/google and /auth/facebook routes will 501 with a clear message
// until the corresponding env vars are filled in.
export const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
export const facebookEnabled = Boolean(
  process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
);

if (googleEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/v1/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser("google", profile);
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn("Google OAuth disabled — set GOOGLE_CLIENT_ID/SECRET in .env to enable it");
}

if (facebookEnabled) {
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
          const user = await findOrCreateOAuthUser("facebook", profile);
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn("Facebook OAuth disabled — set FACEBOOK_APP_ID/SECRET in .env to enable it");
}

export default passport;