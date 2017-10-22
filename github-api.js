const querystring = require('querystring')
const initDebug = require('debug')
const { partialProps } = require('./utils')
const fetchRest = require('./fetch-rest')
const { githubBaseUrl } = require('./config')

const debug = initDebug('workflowUtils:githubApi')

const urls = {
  listPRs(team, repo, queryParams) {
    const qs = queryParams ? '?' + querystring.stringify(queryParams) : ''
    return `${githubBaseUrl}/api/v3/repos/${team}/${repo}/pulls${qs}`
  }
}

const methods = {
  listPRs(headers, team, repo, params) {
    const opts = {
      url: urls.listPRs(team, repo, params),
      method: 'GET',
      headers
    }
    return fetchRest(opts)
  }
}

function login (getCredential) {
  return Promise.all([
    getCredential(githubBaseUrl, 'username'),
    getCredential(githubBaseUrl, 'token')
  ])
    .then((creds) => {
      const encoded = Buffer.from(creds.join(':'), 'utf8').toString('base64')
      const authorization = `Basic ${encoded}`
      return { authorization }
    })
}

function setupGithubApi (getCredential) {
  return login(getCredential)
    .then((headers) => partialProps(methods, headers))
}

module.exports = setupGithubApi
