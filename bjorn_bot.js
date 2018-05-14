const Discord = require('discord.io');
const botCommands = require('./lib/bot_commands');

let bjornBot = new Discord.Client({
  token: process.env.BJORN_BOT_TOKEN,
  autorun: true
});

bjornBot.on('ready', (evt) => {
  console.log(`Logged in as: ${bjornBot.username} (${bjornBot.id})`);
});

bjornBot.on('message', async (user, userID, channelID, message, evt) => {
  if (message[0] == '!') {
    let i = message.indexOf(' ');
    let command = message.slice(1, i);
    let args = message.slice(i + 1);

    if (botCommands[command]) {
      let discordResponse = await botCommands[command](args);

      bjornBot.sendMessage({ to: channelID, message: discordResponse});
    }
  }
});