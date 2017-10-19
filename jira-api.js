const querystring = require('querystring')
const fetch = require('node-fetch')
const { readJsonFile, writeJsonFile } = require('./fs-json')
const { partialProps } = require('./utils')
const fetchRest = require('./fetch-rest')
const { jiraBaseUrl, cookieCachePath } = require('./config')

const urls = {
  auth: `${jiraBaseUrl}/rest/auth/1/session`,
  issue(key, queryParams) {
    const qs = queryParams ? '?' + querystring.stringify(queryParams) : ''
    return `${jiraBaseUrl}/rest/api/2/issue/${key}${qs}`
  }
}

function login ({ username, password }) {
  const opts = {
    url: urls.auth,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  }
  return fetchRest(opts)
    .then(({session: {name, value}}) => {
      return { cookie: `${name}=${value}` }
    })
}

function cachedLogin (credentials) {
  return readJsonFile(cookieCachePath)
    .then((headers) => {
      const opts = {
        url: urls.auth,
        method: 'GET',
        headers,
      }
      return fetchRest(opts)
        .then((data) => {
          console.log('Loaded auth cookie from cache')
          return headers
        })
    })
    .catch((err) => {
      console.warn('Failed to load auth cookie from cache - ', err.message)
      return login(credentials)
        .then((headers) => writeJsonFile(cookieCachePath, headers))
    })
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

function withSession (credentials, methodFn) {
  return cachedLogin(credentials)
    .then((headers) => {
      const api = partialProps(methods, headers)
      return methodFn(api)
    })
}

module.exports = withSession
