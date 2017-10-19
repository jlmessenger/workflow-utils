const withSession = require('./jira-api')
const notification = require('./notification')

const credentials = {
  username: process.env.JIRA_USER,
  password: Buffer.from(process.env.JIRA_PASS, 'base64').toString('utf8')
}

withSession(credentials, (api) => {
  return api.getTicket('ENG-14444', { fields: 'summary' })
})
  .then((issueData) => {
    console.log(issueData)
    notification({ title: 'Ticket', subtitle: issueData.key, message: issueData.fields.summary })
  })
  .catch((err) => {
    console.error(err.message)
    console.error('status:', err.status)
    console.error('body:', err.body)
  })
