const mongoose = require('mongoose');
const superagent = require('superagent');
const forge = require('node-forge');
// const throttledQueue = require('throttled-queue');
const decryptToken = require(__dirname + '/decrypt_token');
const Keep = require(__dirname + '/../models/keep');

module.exports = function() {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://sloth:bearson@ds115350.mlab.com:15350/bjorn_bot_db');

  let keypair = forge.pki.rsa.generateKeyPair({bits: 1024, e: 0x10001});

  // converts forge key object to pem formatted string, then converts
  // to a clean single-line string to be passed to the turbine api
  let publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey).split('\r\n');
  publicKeyPem.shift();
  publicKeyPem.pop();
  publicKeyPem.pop();
  let publicKey = publicKeyPem.join('');

  let privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

  let allKeeps = [];
  let keepUpdatePromises = [];
  // let test_owner_id = 'fff04bb3-6bf9-46a6-8cb9-a51807105f5d';

  superagent.post('https://ronin-prod-authentication.rm.turbinemobile.com/v1/authentication/publickey')
    .send({ public_key: publicKey, "game": null, "consent_map": { "privacy.wb.pp": { "version": 1.0 }, "terms.wb.tos": { "version": 1.0 } }})
    .end((err, res) => {
      let authKey = decryptToken(res.body.token, privateKeyPem);

      console.log('authed - starting');

      Keep.find(null, (err, keeps) => {
        keeps.forEach((owner) => {
          keepUpdatePromises.push(getInfo(owner.owner_id, authKey));
        });

        Promise.all(keepUpdatePromises).then((keeps) => {
          console.log('keeps', keeps.length);
          console.log('all keeps', allKeeps.length);
          mongoose.disconnect();
        });
      });
    });

  function getInfo(owner_id, authKey) {
    return new Promise((resolve, reject) => {
      var reqUrl = `https://ronin-prod-game-player-info.rm.turbinemobile.com/v1/player/${owner_id}/info`;

      superagent.get(reqUrl)
        .set('authorization', authKey)
        .end((err, res) => {
          if (err) {
            console.log(reqUrl);
            return resolve(err);
          }

          Keep.findOne({ owner_id: owner_id }, (err, keep) => {
            if (keep) {
              keep.power = res.body.power;

              Keep.update({ owner_id: owner_id }, keep, (err, data) => {
                if (err) console.log(err);
                if (!data.ok) console.log('error updating keep');

                allKeeps.push(keep.name);
                resolve(keep.name);
                // console.log(owner.name + ' updated');
              });
            } else {
              resolve();
            }
          });
        });
    });
  }
};