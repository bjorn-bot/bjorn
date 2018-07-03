const mongoose = require('mongoose');
const FuzzySearch = require('fuse.js');
const Sloth = require('../models/sloth');

mongoose.connect(process.env.MONGODB_URI || process.env.BJORN_BOT_MLAB_URI);

module.exports.search = function(args) {
  return new Promise((resolve, reject) => {
    Sloth.distinct('allNames', (err, names) => {
      let nameSearcher = new FuzzySearch(names, { shouldSort: true, includeMatches: true });

      let results = nameSearcher.search(args);
      results.length = 3;

      let responsePromises = results.map((result) => {
        return new Promise((innerResolve, innerReject) => {
          Sloth.findOne({ allNames: result.matches[0].value }, (err, sloth) => {
            let discordResponse = '```css\r\n' +
              `[${sloth.allegiance}]${sloth.name} #${sloth.level}\r\n` +
              `coords: (${sloth.location.x}, ${sloth.location.y}) {shield: ${sloth.peaceshield ? 'UP' : 'DOWN'}} {power: ${parseInt(sloth.power)}}\r\n` +
              `{names: '${sloth.allNames.join(' ')}'}\r\n` +
              `{allegiances: '${sloth.allAllegiances.join(' ')}'}\r\n` +
              '```';

            innerResolve(discordResponse);
          });
        });
      });

      Promise.all(responsePromises)
        .then((response) => {
          resolve(response);
        });
    });
  });
};

module.exports.allegiance = function(args) {
  return new Promise((resolve, reject) => {
    Sloth.distinct('allegiance', (err, allegiances) => {
      let allegianceSearcher = new FuzzySearch(allegiances, { shouldSort: true, includeMatches: true });

      let topAllegiance = allegianceSearcher.search(args)[0].matches[0].value;

      Sloth.find({ allegiance: topAllegiance }, (err, allegiance) => {
        if (err) {
          resolve('Something is broken, don\'t bug me for a while');
        }
        if (!allegiance[0]) {
          resolve(`I couldn't find ${args}`);
        }

        let numResponses = Math.ceil(allegiance.length / 30);
        let discordResponses = [];

        for (let i = 0; i < numResponses; i++) {
          let currentResponse = '```css\r\n';
          let numSloths = 30;
          let currentResponseSloths = allegiance.slice(i * numSloths, i * numSloths + numSloths);

          currentResponseSloths.forEach((member) =>{
            let slothName = member.name.toString();
            let slothLevel = member.level.toString();
            let slothX = member.location.x.toString();
            let slothY = member.location.y.toString();

            if (slothName.length < 16) {
              for (let i = 0; i < 16; i++) {
                if (!slothName[i]) slothName += ' ';
              }
            }

            if (slothLevel.length < 2) slothLevel += ' ';

            if (slothX.length < 4 || slothY.length < 4) {
              for (let i = 0; i < 4; i++) {
                if (!slothX[i]) slothX = ' ' + slothX;
                if (!slothY[i]) slothY = ' ' + slothY;
              }
            }

            currentResponse += `[${member.allegiance}]${slothName} #${slothLevel} (${slothX}, ${slothY}) {shield: ${member.peaceshield ? 'UP' : 'DOWN'}}\r\n`;
          });

          currentResponse += '```';
          discordResponses.push(currentResponse);
        }

        resolve(discordResponses);
      });
    });
  });
};

module.exports.unshielded = function(args) {
  return new Promise((resolve, reject) => {
    Sloth.distinct('allegiance', (err, allegiances) => {
      let allegianceSearcher = new FuzzySearch(allegiances, { shouldSort: true, includeMatches: true });

      let topAllegiance = allegianceSearcher.search(args)[0].matches[0].value;

      Sloth.find({ allegiance: topAllegiance }, (err, allegiance) => {
        if (err) {
          resolve('Something is broken, don\'t bug me for a while');
        }
        if (!allegiance[0]) {
          resolve(`I couldn't find ${args}`);
        }

        let numResponses = Math.ceil(allegiance.length / 30);
        let discordResponses = [];

        for (let i = 0; i < numResponses; i++) {
          let currentResponse = '```css\r\n';
          let numSloths = 30;
          let currentResponseSloths = allegiance.slice(i * numSloths, i * numSloths + numSloths);

          currentResponseSloths.forEach((member) =>{
            if (!member.peaceshield) {
              let slothName = member.name.toString();
              let slothLevel = member.level.toString();
              let slothX = member.location.x.toString();
              let slothY = member.location.y.toString();
              let power = member.power.toString().split('.')[0];

              if (slothName.length < 16) {
                for (let i = 0; i < 16; i++) {
                  if (!slothName[i]) slothName += ' ';
                }
              }

              if (slothLevel.length < 2) slothLevel += ' ';

              if (slothX.length < 4 || slothY.length < 4) {
                for (let i = 0; i < 4; i++) {
                  if (!slothX[i]) slothX = ' ' + slothX;
                  if (!slothY[i]) slothY = ' ' + slothY;
                }
              }

              currentResponse += `${slothName} #${slothLevel} (${slothX}, ${slothY}) {power: ${power}}\r\n`;
            }
          });

          currentResponse += '```';
          discordResponses.push(currentResponse);
        }

        resolve(discordResponses);
      });
    });
  });
};

module.exports.hunt = function(args) {
  return new Promise((resolve, reject) => {
    Sloth.find({ level: args }, (err, sloths) => {
      if (err) {
        resolve('Something is broken, don\'t bug me for a while');
      }
      if (!sloths[0]) {
        resolve(`I couldn't find ${args}`);
      }

      let numResponses = Math.ceil(sloths.length / 30);
      let discordResponses = [];

      for (let i = 0; i < numResponses; i++) {
        let currentResponse = '```css\r\n';
        let numSloths = 30;
        let currentResponseSloths = sloths.slice(i * numSloths, i * numSloths + numSloths);

        currentResponseSloths.forEach((sloth) =>{
          if (!sloth.peaceshield) {
            let allegianceName = sloth.allegiance.toString();
            let slothName = sloth.name.toString();
            let slothLevel = sloth.level.toString();
            let slothX = sloth.location.x.toString();
            let slothY = sloth.location.y.toString();
            let power = sloth.power.toString().split('.')[0];

            if (allegianceName.length < 5) {
              for (let i = 0; i < 5; i++) {
                if (!allegianceName[i]) allegianceName += ' ';
              }
            }

            if (slothName.length < 16) {
              for (let i = 0; i < 16; i++) {
                if (!slothName[i]) slothName += ' ';
              }
            }

            if (slothName.length < 16) {
              for (let i = 0; i < 16; i++) {
                if (!slothName[i]) slothName += ' ';
              }
            }

            if (slothLevel.length < 2) slothLevel += ' ';

            if (slothX.length < 4 || slothY.length < 4) {
              for (let i = 0; i < 4; i++) {
                if (!slothX[i]) slothX = ' ' + slothX;
                if (!slothY[i]) slothY = ' ' + slothY;
              }
            }

            currentResponse += `[${allegianceName}]${slothName} (${slothX}, ${slothY}) {power: ${power}}\r\n`;
          }
        });

        currentResponse += '```';
        discordResponses.push(currentResponse);
      }

      resolve(discordResponses);
    });
  });
};
