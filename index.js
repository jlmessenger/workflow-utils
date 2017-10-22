const setupJiraApi = require('./jira-api')
const setupJenkinsApi = require('./jenkins-api')
const setupGithubApi = require('./github-api')
const notification = require('./notification')
const getCredential = require('./get-credential')

return Promise.all([
  setupJiraApi(getCredential),
  setupJenkinsApi(getCredential),
  setupGithubApi(getCredential)
])
  .then(([jiraApi, jenkinsApi, githubApi]) => {
    return jiraApi.getTicket('ABC-1234', { fields: 'summary' })
      .then((issueData) => {
        console.log(issueData)
        return notification({ title: 'Ticket', subtitle: issueData.key, message: issueData.fields.summary })
      })
      .then(() => {
        return jenkinsApi.branchBuild({ team: 'jlmessenger', repo: 'workflow-utils' })
      })
      .then((result) => {
        console.log(result.lastBuild)
      })
      .then(() => {
        return githubApi.listPRs('jlmessenger', 'workflow-utils', { state: 'open' })
      })
      .then((result) => {
        console.log(result[0].title)
      })
  })
  .catch((err) => {
    console.error('ERROR:', err.stack || err)
    console.error('url:', err.requestUrl)
    console.error('HTTP:', err.status)
    console.error('body:', err.body)
  })
