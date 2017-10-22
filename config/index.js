const personalConfig = require('./personal')

// create a file called config/personal.json
// and override the following values for your needs

module.exports = Object.assign({
  // jiraBaseUrl: 'https://jira.atlassian.com',
  // jenkinsBaseUrl: 'https://ci.jenkins.io',
  // githubBaseUrl: 'https://github.com',
  // credentialPrefill: {
  //   'github.com:username': 'jlmessenger',
  //   'github.ua.com:token': 'xxxxxxxxxxxxxxxxxx', // via https://github.com/settings/tokens
  //   'underarmour.atlassian.net:username': 'jlmessenger@users.noreply.github.com'
  // },
  credentials: {
    protectedKeys: ['password'],
    showNotification: true
  },
  cookieCache: {
    jira: '.cookie.jira.json',
    jenkins: '.cookie.jenkins.json',
    github: '.cookie.github.json',
  }
}, personalConfig)
