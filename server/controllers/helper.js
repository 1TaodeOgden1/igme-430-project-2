//a bunch of helper methods that may need to be utilized
//across the entire server-side code

const models = require('../models');

const { Account } = models;

//the account the user is logged into, represented as a json
//empty until the user successfully logs in / signs up
let currentAccount = {};


//a function intended to be used as a callback, simply
//returns the account stored here
const getAccountJSON =  (req, res) => {
    return res.json({currentAccount});
}


module.exports = {
    currentAccount,
    getAccountJSON
}