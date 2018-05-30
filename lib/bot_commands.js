const mongoose = require('mongoose');
const FuzzySearch = require('fuse.js');
const Keep = require('../models/keep');

mongoose.connect(process.env.MONGODB_URI || process.env.BJORN_BOT_MLAB_URI);

module.exports.search = function(args) {
  return new Promise((resolve, reject) => {
    Keep.distinct('allNames', (err, names) => {
      let nameSearcher = new FuzzySearch(names, { shouldSort: true, includeMatches: true });

      let results = nameSearcher.search(args);
      results.length = 3;

      let responsePromises = results.map((result) => {
        return new Promise((innerResolve, innerReject) => {
          Keep.findOne({ allNames: result.matches[0].value }, (err, keep) => {
            let discordResponse = `[${keep.allegiance}]${keep.name} #${keep.level} (${keep.location.x}, ${keep.location.y}) {shield: ${keep.peaceshield ? 'UP' : 'DOWN'}}`;

            innerResolve(discordResponse);
          });
        });
      });

      Promise.all(responsePromises)
        .then((response) => {
          resolve(response.join('\r\n'));
        });
    });
  });
};

module.exports.allegiance = function(args) {
  return new Promise((resolve, reject) => {
    Keep.distinct('allegiance', (err, allegiances) => {
      let allegianceSearcher = new FuzzySearch(allegiances, { shouldSort: true, includeMatches: true });

      let topAllegiance = allegianceSearcher.search(args)[0].matches[0].value;

      Keep.find({ allegiance: topAllegiance }, (err, allegiance) => {
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
          let numKeeps = 30;
          let currentResponseKeeps = allegiance.slice(i * numKeeps, i * numKeeps + numKeeps);

          currentResponseKeeps.forEach((member) =>{
            let keepName = member.name.toString();
            let keepLevel = member.level.toString();
            let keepX = member.location.x.toString();
            let keepY = member.location.y.toString();

            if (keepName.length < 16) {
              for (let i = 0; i < 16; i++) {
                if (!keepName[i]) keepName += ' ';
              }
            }

            if (keepLevel.length < 2) keepLevel += ' ';

            if (keepX.length < 4 || keepY.length < 4) {
              for (let i = 0; i < 4; i++) {
                if (!keepX[i]) keepX = ' ' + keepX;
                if (!keepY[i]) keepY = ' ' + keepY;
              }
            }

            currentResponse += `[${member.allegiance}]${keepName} #${keepLevel} (${keepX}, ${keepY}) {shield: ${member.peaceshield ? 'UP' : 'DOWN'}}\r\n`;
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
    Keep.distinct('allegiance', (err, allegiances) => {
      let allegianceSearcher = new FuzzySearch(allegiances, { shouldSort: true, includeMatches: true });

      let topAllegiance = allegianceSearcher.search(args)[0].matches[0].value;

      Keep.find({ allegiance: topAllegiance }, (err, allegiance) => {
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
          let numKeeps = 30;
          let currentResponseKeeps = allegiance.slice(i * numKeeps, i * numKeeps + numKeeps);

          currentResponseKeeps.forEach((member) =>{
            if (!member.peaceshield) {
              let keepName = member.name.toString();
              let keepLevel = member.level.toString();
              let keepX = member.location.x.toString();
              let keepY = member.location.y.toString();
              let power = member.power.toString().split('.')[0];

              if (keepName.length < 16) {
                for (let i = 0; i < 16; i++) {
                  if (!keepName[i]) keepName += ' ';
                }
              }

              if (keepLevel.length < 2) keepLevel += ' ';

              if (keepX.length < 4 || keepY.length < 4) {
                for (let i = 0; i < 4; i++) {
                  if (!keepX[i]) keepX = ' ' + keepX;
                  if (!keepY[i]) keepY = ' ' + keepY;
                }
              }

              currentResponse += `${keepName} #${keepLevel} (${keepX}, ${keepY}) {power: ${power}}\r\n`;
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
    Keep.find({ level: args }, (err, keeps) => {
      if (err) {
        resolve('Something is broken, don\'t bug me for a while');
      }
      if (!keeps[0]) {
        resolve(`I couldn't find ${args}`);
      }

      let numResponses = Math.ceil(keeps.length / 30);
      let discordResponses = [];

      for (let i = 0; i < numResponses; i++) {
        let currentResponse = '```css\r\n';
        let numKeeps = 30;
        let currentResponseKeeps = keeps.slice(i * numKeeps, i * numKeeps + numKeeps);

        currentResponseKeeps.forEach((keep) =>{
          if (!keep.peaceshield) {
            let allegianceName = keep.allegiance.toString();
            let keepName = keep.name.toString();
            let keepLevel = keep.level.toString();
            let keepX = keep.location.x.toString();
            let keepY = keep.location.y.toString();
            let power = keep.power.toString().split('.')[0];

            if (allegianceName.length < 5) {
              for (let i = 0; i < 5; i++) {
                if (!allegianceName[i]) allegianceName += ' ';
              }
            }

            if (keepName.length < 16) {
              for (let i = 0; i < 16; i++) {
                if (!keepName[i]) keepName += ' ';
              }
            }

            if (keepName.length < 16) {
              for (let i = 0; i < 16; i++) {
                if (!keepName[i]) keepName += ' ';
              }
            }

            if (keepLevel.length < 2) keepLevel += ' ';

            if (keepX.length < 4 || keepY.length < 4) {
              for (let i = 0; i < 4; i++) {
                if (!keepX[i]) keepX = ' ' + keepX;
                if (!keepY[i]) keepY = ' ' + keepY;
              }
            }

            currentResponse += `[${allegianceName}]${keepName} (${keepX}, ${keepY}) {power: ${power}}\r\n`;
          }
        });

        currentResponse += '```';
        discordResponses.push(currentResponse);
      }

      resolve(discordResponses);
    });
  });
};
