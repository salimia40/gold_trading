import passport from "passport";
import { compare } from "bcryptjs";
import { Context } from "./context";

import {
  mutationField,
  nonNull,
  objectType,
  queryField,
  stringArg,
} from "nexus";

import { prisma } from "../services/db";
import { createUser, userExists } from "../services/user";

passport.serializeUser((user, done) => {
  // @ts-ignore
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await prisma.user.findUnique({
    where: { id: id as number },
  });
  return done(null, user);
});

export const signupMutation = mutationField(
  "signup",
  {
    type: "AuthPayload",
    args: {
      name: nonNull(stringArg()),
      username: nonNull(stringArg()),
      password: nonNull(stringArg()),
      email: nonNull(stringArg()),
      phone: nonNull(stringArg()),
      bank_name: nonNull(stringArg()),
      bank_number: nonNull(stringArg()),
    },
    resolve: async (
      _parent,
      { name, email, username, password, bank_name, bank_number, phone },
      context: Context,
    ) => {
      var [exists, msg] = await userExists(email, username);
      if (exists) {
        return {
          success: false,
          error: String(msg),
          user: null,
        };
      }

      const user = await createUser(
        name,
        username,
        email,
        password,
        phone,
        bank_name,
        bank_number,
      );

      context.login(user);

      return {
        success: true,
        user,
      };
    },
  },
);

export const loginMutation = mutationField(
  "login",
  {
    type: "AuthPayload",
    args: {
      password: nonNull(stringArg()),
      email: nonNull(stringArg()),
    },
    resolve: async (_parent, { email, password }, context: Context) => {
      const user = await prisma.user.findUnique({
        where: { email: email as string },
      });
      if (user == null) {
        return {
          success: false,
          user: null,
          error: "user not found!",
        };
      }
      if (!await compare(password as string, user.password)) {
        return {
          success: false,
          user: null,
          error: "wrong password!",
        };
      }
      context.login(user);
      return {
        success: true,
        user,
      };
    },
  },
);

export const logoutMutation = mutationField(
  "logout",
  {
    type: "AuthPayload",
    resolve: async (_parent, args, context: Context) => {
      if (context.isAuthenticated()) {
        context.logout();
      }

      return {
        success: true,
        user: null,
      };
    },
  },
);

const AuthPayload = objectType({
  name: "AuthPayload",
  definition(t) {
    t.boolean("success");
    t.nullable.string("error");
    t.field("user", { type: "User" });
  },
});

export const AuthMutations = {
  AuthPayload,
  signupMutation,
  loginMutation,
  logoutMutation,
};
