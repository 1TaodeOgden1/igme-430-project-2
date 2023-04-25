const models = require('../models');
const helper = require('./helper.js');

const mainPage = (req, res) => {
  res.render('main-menu',
    {
      nickname: helper.currentAccount.nickname
    });
}

const createRoom = (req, res) => {

}

const hostRoom = (req, res) => {

}

const lobby = (req, res) => {

}

module.exports = {
  mainPage,
  createRoom,
  hostRoom,
  lobby,
}