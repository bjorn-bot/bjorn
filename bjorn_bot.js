const Discord = require('discord.io');
const botCommands = require('./lib/bot_commands');

let bjornBot = new Discord.Client({
  token: process.env.BJORN_BOT_TOKEN,
  autorun: true
});

bjornBot.on('ready', (evt) => {
  bjornBot.editUserInfo({ username: 'Bjorn' });
  console.log(`Logged in as: ${bjornBot.username} (${bjornBot.id})`);
});

bjornBot.on('message', async (user, userID, channelID, message, evt) => {
  if (message[0] == '!') {
    let i = message.indexOf(' ');
    if (i === -1) {
      i = message.length;
    }
    let command = message.slice(1, i);
    let args = message.slice(i + 1);

    if (botCommands[command]) {
      let discordResponse = await botCommands[command](args);

      if (Array.isArray(discordResponse)) {
        discordResponse.forEach((response) => {
          bjornBot.sendMessage({ to: channelID, message: response});
        });
      } else {
        bjornBot.sendMessage({ to: channelID, message: discordResponse});
      }
    }
  }
});