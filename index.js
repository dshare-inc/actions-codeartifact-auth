const core = require('@actions/core');
const exec = require('@actions/exec');
const io = require('@actions/io');
const fs = require('fs');
const codeArtifact = require('@aws-sdk/client-codeartifact');

async function run() {
  const region = core.getInput('region', { required: true });
  const domain = core.getInput('domain', { required: true });
  const owner = core.getInput('owner', { required: true });
  const duration = core.getInput('duration', { required: false });
  const type = core.getInput('type', { required: true });
  const repo = core.getInput('repo', { required: true });

  const client = new codeArtifact.CodeartifactClient({ region: region });
  const authCommand = new codeArtifact.GetAuthorizationTokenCommand({
    domain: domain,
    domainOwner: owner,
    durationSeconds: duration
  });

  core.debug(`AWS CodeArtifact Login(Auth) ${domain}-${owner}`);

  const response = await client.send(authCommand);
  const authToken = response.authorizationToken;
  if (response.authorizationToken === undefined) {
    throw Error(`AWS CodeArtifact Authentication Failed: ${response.$metadata.httpStatusCode} (${response.$metadata.requestId})`);
  }

  switch(type) {
    case 'gradle':
      gradle(domain, owner, region, repo, authToken);
      break;
    case 'npm':
      await npm(domain, owner, region, repo, authToken);
      break;
  }

  core.setOutput('registry', `https://${domain}-${owner}.d.codeartifact.${region}.amazonaws.com`);
  core.setSecret(authToken);
}

async function npm(domain, owner, region, repo, authToken) {
  const file = `
registry=https://${domain}-${owner}.d.codeartifact.${region}.amazonaws.com/npm/${repo}/
//${domain}-${owner}.d.codeartifact.${region}.amazonaws.com/npm/${repo}/:_authToken=${authToken}
//${domain}-${owner}.d.codeartifact.${region}.amazonaws.com/npm/${repo}/:always-auth=true
`;
  io.rmRF('.npmrc');
  fs.writeFile(`.npmrc`, file, { flag: 'wx' }, (callback) => {
    if (callback) core.setFailed(callback);
  });
}

async function gradle(domain, owner, region, repo, authToken) {
  const file = `
codeartifactToken=${authToken}
`
  io.rmRF('gradle.properties');
  fs.writeFile(`gradle.properties`, file, { flag: 'wx' }, (c) => {
    if (c) core.setFailed(c);
  });
}

module.exports = run;

/* istanbul ignore next */
if (require.main === module) {
    run();
}
