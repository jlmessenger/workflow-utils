const withJiraSession = require('./jira-api')
const withJenkinsSession = require('./jenkins-api')
const notification = require('./notification')
const getCredential = require('./get-credential')

return Promise.all([
  withJiraSession(getCredential),
  withJenkinsSession(getCredential)
])
  .then(([jiraApi, jenkinsApi]) => {
    return jiraApi.getTicket('ENG-14444', { fields: 'summary' })
      .then((issueData) => {
        console.log(issueData)
        return notification({ title: 'Ticket', subtitle: issueData.key, message: issueData.fields.summary })
      })
      .then(() => {
        return jenkinsApi.branchBuild({ team: 'lib', repo: 'ua-messages' })
      })
      .then((result) => {
        console.log(result.lastBuild)
      })
  })
  .catch((err) => {
    console.error('ERROR:', err.stack || err)
    console.error('url:', err.requestUrl)
    console.error('HTTP:', err.status)
    console.error('body:', err.body)
  })
