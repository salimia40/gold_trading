import { allow, or, rule, shield } from "graphql-shield";
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
    getUser: or(rules.isAdmin, rules.isOwner),
    getUsers: or(rules.isAdmin, rules.isOwner),
  },
  Mutation: {
    login: allow,
    signup: allow,
    logout: allow,
    verifyUser: or(rules.isAdmin, rules.isOwner),
    changeUserVipSettings: or(rules.isAdmin, rules.isOwner),
    changeUserRole: rules.isOwner,
  },
});
