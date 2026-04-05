require('./utils/js-helper');
const utils = require('./utils/js-helper');
const fs = require('fs');

function processData(data) {
  return utils.formatData(data);
}

module.exports = {
  processData,
  readConfig: function() {
    return fs.readFileSync('config.json', 'utf8');
  }
};
