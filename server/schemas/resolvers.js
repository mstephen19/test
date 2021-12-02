const { AuthenticationError } = require('apollo-server-express');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
// Import models
const { Event, User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.user) return new AuthenticationError('Not logged in!');

      const me = await User.findOne({ _id: context.user._id });

      if (!me) return new Error('User not found in database.');

      return me;
    },
    user: async (parent, { username }) => {
      const theUser = await User.findOne({ username });

      if (!theUser) return new Error('User with this username not found.');

      return theUser;
    },
  },
  Mutation: {
    newUser: async (parent, args, context) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    login: async (parent, { username, password }, context) => {
      const user = await User.findOne({ username });

      if (!user)
        return new AuthenticationError('No user with this username found.');

      const correctPass = user.checkPassword(password);

      if (!correctPass) return new AuthenticationError('Incorrect password.');

      const token = signToken(user);
      return { token, user };
    },
  },
  // Define custom type of Date
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value);
    },
    serialize(value) {
      return value.getTime();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10);
      }
      return null;
    },
  }),
};

module.exports = resolvers;
