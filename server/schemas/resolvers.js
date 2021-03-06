const { AuthenticationError } = require('apollo-server-express');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
// Import models

const { Types } = require('mongoose');
// ex. { $push: { exercises: Types.ObjectId(_id) } },

const { Event, User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.user) return new AuthenticationError('Not logged in!');
      try {
        const me = await User.findOne({ _id: context.user._id });

        if (!me) return new Error('User not found in database.');

        return me;
      } catch (err) {
        return err;
      }
    },
    user: async (parent, { username }) => {
      try {
        const theUser = await User.findOne({ username }).populate('events');

        if (!theUser) return new Error('User with this username not found.');

        return theUser;
      } catch (err) {
        return err;
      }
    },
    users: async () => {
      try {
        const users = await User.find({}).populate('events');

        return users;
      } catch (err) {
        return err;
      }
    },
    event: async (parent, { id }) => {
      try {
        const event = await Event.findById(id).populate('attending');

        if (!event) return new Error('Event not found.');

        return event;
      } catch (err) {
        return err;
      }
    },
    events: async (parent, { location }) => {
      try {
        // const regex = new RegExp(location, i);

        const events = await Event.find({ location }).populate('attending');

        if (!events) return new Error('Unable to find events');

        return events;
      } catch (err) {
        return err;
      }
    },
  },
  Mutation: {
    newUser: async (parent, args, context) => {
      try {
        const user = await User.create(args);
        const token = signToken(user);

        return { token, user };
      } catch (err) {
        return err;
      }
    },
    login: async (parent, { username, password }, context) => {
      try {
        const user = await User.findOne({ username });

        if (!user)
          return new AuthenticationError('No user with this username found.');

        const correctPass = user.checkPassword(password);

        if (!correctPass) return new AuthenticationError('Incorrect password.');

        const token = signToken(user);
        return { token, user };
      } catch (err) {
        return err;
      }
    },
    newEvent: async (parent, { name, body, location, address }, { user }) => {
      if (!user) return new AuthenticationError('Must be logged in!');
      try {
        const newEvent = await Event.create({
          creator: user._id,
          name,
          body,
          location,
          address,
        });

        if (!newEvent) return new Error('Failed to create event.');

        return newEvent;
      } catch (err) {
        return err;
      }
    },
    deleteEvent: async (parent, args, { user }) => {
      if (!user)
        return new AuthenticationError("You shouldn't be able to do this...");

      try {
        const deletedEvent = await Event.deleteOne({
          _id: args.id,
          creator: user._id,
        });

        if (!deletedEvent) return new Error('Failed to delete event.');

        return deletedEvent;
      } catch (err) {
        return err;
      }
    },
    attendEvent: async (parent, { id }, { user }) => {
      if (!user) return new AuthenticationError('Must be logged in!');
      try {
        const withNewUser = await Event.findOneAndUpdate(
          { _id: id },
          { $push: { attending: Types.ObjectId(user._id) } },
          { new: true }
        );

        return withNewUser;
      } catch (err) {
        return err;
      }
    },
    unAttendEvent: async (parent, { id }, { user }) => {
      if (!user) return new AuthenticationError('Must be logged in!');
      try {
        const deleteUser = await Event.findOneAndUpdate(
          { _id: id },
          { $pullAll: { attending: { _id: Types.ObjectId(user._id) } } },
          { new: true }
        );

        return deleteUser;
      } catch (err) {
        return err;
      }
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
