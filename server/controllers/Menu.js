const models = require('../models');

const { Account } = models;

const mainPage = (req, res) => {
    res.render('main-menu');
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