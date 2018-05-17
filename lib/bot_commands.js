const mongoose = require('mongoose');
const FuzzySearch = require('fuse.js');
const Keep = require('../models/keep');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://sloth:bearson@ds115350.mlab.com:15350/bjorn_bot_db');

module.exports.search = function(args) {
  return new Promise((resolve, reject) => {
    Keep.distinct('allNames', (err, names) => {
      let nameSearcher = new FuzzySearch(names, { shouldSort: true, includeMatches: true });

      let results = nameSearcher.search(args);
      results.length = 3;

      let responsePromises = results.map((result) => {
        return new Promise((innerResolve, innerReject) => {
          Keep.findOne({ allNames: result.matches[0].value }, (err, keep) => {
            let discordResponse = `[${keep.allegiance}]${keep.name} (${keep.level}) location: ${keep.location} shield: ${keep.peaceshield ? 'UP' : 'DOWN'}`;

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
            if (!member.peaceshield) {
              currentResponse += `[${member.allegiance}]${member.name} #${member.level} (${member.location.x}, ${member.location.y}) {shield: ${member.peaceshield ? 'UP' : 'DOWN'}}\r\n`;
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
              currentResponse += `[${member.allegiance}]${member.name} #${member.level} (${member.location.x}, ${member.location.y}) {shield: ${member.peaceshield ? 'UP' : 'DOWN'}}\r\n`;
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
            currentResponse += `[${keep.allegiance}]${keep.name} #${keep.level} (${keep.location.x}, ${keep.location.y}) {shield: ${keep.peaceshield ? 'UP' : 'DOWN'}}\r\n`;
          }
        });

        currentResponse += '```';
        discordResponses.push(currentResponse);
      }

      resolve(discordResponses);
    });
  });
};
