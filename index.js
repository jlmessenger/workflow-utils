const setupJiraApi = require('./lib/api-jira')
const setupJenkinsApi = require('./lib/api-jenkins')
const setupGithubApi = require('./lib/api-github')
const getCredential = require('./lib/get-credential')

function logError(err) {
  console.error('ERROR:', err.stack || err)
  console.error('url:', err.requestUrl)
  console.error('status:', err.status)
  console.error('body:', err.body)
}

function getJiraApi () {
  return setupJiraApi(getCredential)
}

function getJenkinsApi () {
  return setupJiraApi(getCredential)
}

function getGithubApi () {
  return setupGithubApi(getCredential)
}

function getApis (enabledApis = {}) {
  const {
    jiraApi: useJira,
    jenkinsApi: useJenkins,
    githubApi: useGithub
  } = Object.assign({ jiraApi: true, jenkinsApi: true, jiraApi: true }, enabledApis)

  return Promise.all([
    useJira && getJiraApi(),
    useJenkins && getJenkinsApi(),
    useGithub && getGithubApi()
  ])
    .then(([jiraApi, jenkinsApi, githubApi]) => ({
      jiraApi,
      jenkinsApi,
      githubApi
    }))
}

module.exports = Object.assign(getApis, { logError, getJiraApi, getJenkinsApi, getGithubApi })
