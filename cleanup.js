const core = require('@actions/core');
const exec = require('@actions/exec');
const io = require('@actions/io');

async function cleanup() {
  await io.rmRF('~/.npmrc');
  await io.rmRF('~/.gradle/gradle.properties');
  await io.rmRF('./gradle.properties');
}

module.exports = cleanup;

/* istanbul ignore next */
if (require.main === module) {
  cleanup();
}
