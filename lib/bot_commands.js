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
            let discordResponse = `${keep.name} is located at ${keep.location}, and their shield is ${keep.peaceshield ? 'up' : 'DOWN'}`;

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