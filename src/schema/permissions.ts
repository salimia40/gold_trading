import { allow, and, or, rule, shield } from "graphql-shield";
import { Context } from "./context";

const rules = {
  isAuthenticatedUser: rule()((_parent, _args, context: Context) => {
    return context.isAuthenticated();
  }),
  isAdmin: rule()((_parent, _args, context: Context) => {
    return context.getUser()?.role == "admin";
  }),
  isOwner: rule()((_parent, _args, context: Context) => {
    return context.getUser()?.role == "owner";
  }),
};

export const permissions = shield({
  Query: {
    me: rules.isAuthenticatedUser,
    getUser: and(rules.isAuthenticatedUser, or(rules.isAdmin, rules.isOwner)),
    getUsers: and(rules.isAuthenticatedUser, or(rules.isAdmin, rules.isOwner)),
  },
  Mutation: {
    login: allow,
    signup: allow,
    logout: allow,
    verifyUser: and(
      rules.isAuthenticatedUser,
      or(rules.isAdmin, rules.isOwner),
    ),
    changeUserVipSettings: and(
      rules.isAuthenticatedUser,
      or(rules.isAdmin, rules.isOwner),
    ),
    changeUserRole: and(rules.isAuthenticatedUser, rules.isOwner),
    chargeUser: and(
      rules.isAuthenticatedUser,
      or(rules.isAdmin, rules.isOwner),
    ),
    chargeRequest: and(
      rules.isAuthenticatedUser,
      or(rules.isAdmin, rules.isOwner),
    ),
    dischargeRequest: and(
      rules.isAuthenticatedUser,
      or(rules.isAdmin, rules.isOwner),
    ),
    confirmTransaction: and(
      rules.isAuthenticatedUser,
      or(rules.isAdmin, rules.isOwner),
    ),
    doTransaction: and(
      rules.isAuthenticatedUser,
      or(rules.isAdmin, rules.isOwner),
    ),
  },
  Subscription: {
    newUsers: rules.isAuthenticatedUser,
  },
});
