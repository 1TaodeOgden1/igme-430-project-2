/* This file defines our schema and model interface for the account data.

   We first import bcrypt and mongoose into the file. bcrypt is an industry
   standard tool for encrypting passwords. Mongoose is our tool for
   interacting with our mongo database.
*/
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

/* When generating a password hash, bcrypt (and most other password hash
   functions) use a "salt". The salt is simply extra data that gets hashed
   along with the password. The addition of the salt makes it more difficult
   for people to decrypt the passwords stored in our database. saltRounds
   essentially defines the number of times we will hash the password and salt.
*/
const saltRounds = 10;

let AccountModel = {};

/* Our schema defines the data we will store. A username (string of alphanumeric
   characters), a password (actually the hashed version of the password created
   by bcrypt), and the created date.
*/
const AccountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^[A-Za-z0-9_\-.]{1,16}$/,
  },
  password: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  wins: {
    type: Number,
    required: true,
  },
  premium: {
    type: Boolean,
    required: true,
  },
});

// Converts a doc to something we can store in redis later on.
AccountSchema.statics.toAPI = (doc) => ({
  username: doc.username,
  createdDate: doc.createdDate,
  _id: doc._id,
  wins: doc.wins,
  premium: doc.premium
});

// Helper function to hash a password
AccountSchema.statics.generateHash = (password) => bcrypt.hash(password, saltRounds);

/* Helper function for authenticating a password against one already in the
   database. Essentially when a user logs in, we need to verify that the password
   they entered matches the one in the database. Since the database stores hashed
   passwords, we need to get the hash they have stored. We then pass the given password
   and hashed password to bcrypt's compare function. The compare function hashes the
   given password the same number of times as the stored password and compares the result.
*/
AccountSchema.statics.authenticate = async (username, password, callback) => {
  try {
    const doc = await AccountModel.findOne({ username }).exec();
    if (!doc) {
      return callback();
    }

    const match = await bcrypt.compare(password, doc.password);
    if (match) {
      return callback(null, doc);
    }
    return callback();
  } catch (err) {
    return callback(err);
  }
};

AccountSchema.statics.toJSON = async (username, callback) => {
  try {
    // since we this method is only called after authentication succeeds, we should
    // always get the correct account
    const doc = await AccountModel.findOne({ username }).exec();
    return doc.toObject();
  } catch (err) {
    console.log('error!');
    return (callback(err));
  }
};

AccountSchema.statics.AddWin = async (username) => {
  const doc = await AccountModel.findOne({ username });
  doc.wins++;
  await doc.save();
};

AccountSchema.statics.UpdatePass = async (username, newpass) => {
  const doc = await AccountModel.findOne({ username });
  doc.password = await bcrypt.hash(newpass, saltRounds);
  await doc.save();
};

AccountSchema.statics.CheckPremium = async (username) => {
  const doc = await AccountModel.findOne({ username });

  return doc.premium;
}

AccountModel = mongoose.model('Account', AccountSchema);
module.exports = AccountModel;
