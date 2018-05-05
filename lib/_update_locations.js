const mongoose = require('mongoose');
const superagent = require('superagent');
const forge = require('node-forge');
const throttledQueue = require('throttled-queue');
const decryptToken = require(__dirname + '/decrypt_token');
const Keep = require(__dirname + '/../models/keep');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://sloth:bearson@ds115350.mlab.com:15350/bjorn_bot_db');

let keypair = forge.pki.rsa.generateKeyPair({bits: 1024, e: 0x10001});
var foundKeeps = 0;
var untdKeeps = 0;
var klausKeeps = 0;
var outlwKeeps = 0;
var dietyKeeps = 0;
var fenixKeeps = 0;

var allKeeps = [];
var mapWalkPromises = [];
var keepUpdatePromises = [];

// converts forge key object to pem formatted string, then converts
// to a clean single-line string to be passed to the turbine api
let publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey).split('\r\n');
publicKeyPem.shift();
publicKeyPem.pop();
publicKeyPem.pop();
let publicKey = publicKeyPem.join('');

let privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
superagent.post('https://ronin-prod-authentication.rm.turbinemobile.com/v1/authentication/publickey')
  .send({ public_key: publicKey })
  .end((err, res) => {
    let authKey = decryptToken(res.body.token, privateKeyPem);
    let isUpdated = {};

    console.log('authed - starting');
    var xVal = 0;
    while(xVal < 1337) {
      var yVal = 0;
      while (yVal < 2164) {

        mapWalkPromises.push(throt(xVal, yVal, authKey, isUpdated));

        yVal = yVal + 60;
      }
      xVal = xVal + 60;
    }
    // for (var xVal = 0; xVal < 1337; xVal += 60) {
    //   for (var yVal = 0; yVal < 2164; yVal += 60) {
    //     mapWalkPromises.push(throt(xVal, yVal, authKey, isUpdated));
    //   }
    // }

    Promise.all(mapWalkPromises)
      .then(() => {
        Promise.all(keepUpdatePromises)
          .then(() => {
            console.log('all keeps', allKeeps.length);
            mongoose.disconnect();
            process.exit(0);
          })
          .catch((err) => {
            if (err) console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  });

function throt(xVal, yVal, authKey, isUpdated) {
  return new Promise((resolve, reject) => {
    let throttle = throttledQueue(15, 1000); // 15 times per second
    throttle(function () {
      var reqUrl = 'https://ronin-prod-world-map.rm.turbinemobile.com/v1/map/35/node?x=' +
      xVal +
      '&y=' +
      yVal +
      '&w=60&h=80&metadata=1';

      superagent.get(reqUrl)
        .set('authorization', authKey)
        .end((err, res) => {
          if (err) {
            console.log(reqUrl);
            return resolve(err);
          } //console.log(err);

          let owners = res.body.metadata.owners;

          res.body.nodes.forEach((node) => {
            if (node.owner_id && !isUpdated[node.owner_id]) {
              let owner = owners[node.owner_id].namespaces;

              let ownerData = {
                owner_id: node.owner_id,
                name: owner.player.name,
                peaceshield: owner.player.peaceshield,
                sop: !!owner.sop.title_def,
                allegiance: owner.allegiance.tag,
                level: owner.home.level,
                location: {
                  x: node.location.x,
                  y: node.location.y
                }
              };

              keepUpdatePromises.push(new Promise((innerResolve, innerReject) => {
                Keep.findOne({ owner_id: ownerData.owner_id }, (err, keep) => {
                    if (!keep) {
                        ownerData.allNames = [
                            ownerData.name.normalize('NFD').replace(/[\u0300-\u036f]/g, ""),
                            ownerData.name
                        ];
                        ownerData.allAllegiances = [ownerData.allegiance];

                        let newKeep = new Keep(ownerData);

                        newKeep.save((err) => {
                            if (err) console.log(err);
                            allKeeps.push(ownerData);
                            return innerResolve();
                        });
                    } else {

                    if (keep.allNames[keep.allNames.length - 1] !== ownerData.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "")) {
                        keep.allNames.push(ownerData.name.normalize('NFD').replace(/[\u0300-\u036f]/g, ""));

                        if(ownerData.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "") !== ownerData.name) {
                            keep.allNames.push(ownerData.name);
                        }
                    }

                    ownerData.allNames = keep.allNames;

                    if (keep.allAllegiances[keep.allAllegiances.length - 1] !== ownerData.allegiance) {
                        keep.allAllegiances.push(ownerData.allegiance);
                    }
                    ownerData.allAllegiances = keep.allAllegiances;

                    Keep.update({ owner_id: ownerData.owner_id }, ownerData, (err, data) => {
                        if (err) console.log(err);
                        if (!data.ok) console.log('error updating keep');
                        allKeeps.push(ownerData);
                        return innerResolve();
                    });
                  }
                });
                // return innerResolve();
              }));

              isUpdated[ownerData.owner_id] = true;
            }
          });

          return resolve();
        });
    });
  });
}
