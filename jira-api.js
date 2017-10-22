const querystring = require('querystring')
const initDebug = require('debug')
const { readJsonFile, writeJsonFile } = require('./fs-json')
const { partialProps } = require('./utils')
const fetchRest = require('./fetch-rest')
const { jiraBaseUrl, cookieCache: { jira: jiraCookiePath } } = require('./config')

const debug = initDebug('workflowUtils:jiraApi')

const urls = {
  auth: `${jiraBaseUrl}/rest/auth/1/session`,
  issue(key, queryParams) {
    const qs = queryParams ? '?' + querystring.stringify(queryParams) : ''
    return `${jiraBaseUrl}/rest/api/2/issue/${key}${qs}`
  }
}

const methods = {
  getTicket(headers, issueKey, params) {
    const opts = {
      url: urls.issue(issueKey, params),
      method: 'GET',
      headers
    }
    return fetchRest(opts)
  }
}

function login (getCredential) {
  return Promise.all([
    getCredential(urls.auth, 'username'),
    getCredential(urls.auth, 'password')
  ])
    .then(([username, password]) => {
      return fetchRest({
        url: urls.auth,
        method: 'POST',
        body: { username, password }
      })
    })
    .then(({session: {name, value}}) => {
      debug('login completed')
      return { cookie: `${name}=${value}` }
    })
}

function cachedLogin (credentials) {
  return readJsonFile(jiraCookiePath)
    .then((headers) => {
      const opts = {
        url: urls.auth,
        method: 'GET',
        headers,
      }
      return fetchRest(opts)
        .then((data) => {
          debug('cachedLogin test call succeed')
          return headers
        })
    })
    .catch((err) => {
      debug('cachedLogin had no cached session or test call failed, will try login - %s', err.message)
      return login(credentials)
        .then((headers) => writeJsonFile(jiraCookiePath, headers))
    })
}

function withSession (getCredential) {
  return cachedLogin(getCredential)
    .then((headers) => partialProps(methods, headers))
}

module.exports = withSession
