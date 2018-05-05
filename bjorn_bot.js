var Discord = require('discord.io');
var mongoose = require('mongoose');
const Keep = require('./models/keep');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://sloth:bearson@ds115350.mlab.com:15350/bjorn_bot_db');

let bjornBot = new Discord.Client({
  token: process.env.BJORN_BOT_TOKEN,
  autorun: true
});

bjornBot.on('ready', (evt) => {
  console.log(`Logged in as: ${bjornBot.username} (${bjornBot.id})`);
});

bjornBot.on('message', (user, userID, channelID, message, evt) => {
  if (message[0] == '!') {
    let i = message.indexOf(' ');
    let command = message.slice(1, i);
    let args = message.slice(i + 1);

    if (command === 'search') {
      Keep.findOne({ name: args }, (err, keep) => {
        if (err) {
          return bjornBot.sendMessage({
            to: channelID,
            message: 'Something is broken, don\'t bug me for a while'
          });
        }
        if (!keep) {
          return bjornBot.sendMessage({
            to: channelID,
            message: `I couldn't find ${args}`
          });
        }

        return bjornBot.sendMessage({
          to: channelID,
          message: `[${keep.allegiance}]${args}, keep level: ${keep.level}, location: ${keep.location}, peace shield: ${keep.peaceshield}, in sop: ${keep.sop}`
        });
      });
    }
  }
});