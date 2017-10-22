const url = require('url')
const querystring = require('querystring')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const initDebug = require('debug')
const { partialProps } = require('./utils')
const fetchRest = require('./fetch-rest')
const makeCookieJar = require('./cookie-jar')
const { jenkinsBaseUrl, cookieCache: { jenkins: jenkinsCookieJarPath } } = require('./config')

const debug = initDebug('workflowUtils:jenkinsApi')

const urls = {
  oauthEntry: `${jenkinsBaseUrl}/securityRealm/commenceLogin?from=%2F`,
  homepageApi: `${jenkinsBaseUrl}/api/json`,
  prBuild(team, repo, prName) {
    return `${jenkinsBaseUrl}/job/${team}/job/${repo}/view/change-requests/job/${prName}/api/json`
  },
  branchBuild(team, repo, branch) {
    return `${jenkinsBaseUrl}/job/${team}/job/${repo}/job/${branch}/api/json`
  }
}

const methods = {
  prBuild(headers, { team, repo, prName }) {
    const opts = {
      url: urls.prBuild(team, repo, prName),
      method: 'GET',
      headers
    }
    return fetchRest(opts)
  },
  branchBuild(headers, { team, repo, branch = 'master' }) {
    const opts = {
      url: urls.branchBuild(team, repo, branch),
      method: 'GET',
      headers
    }
    return fetchRest(opts)
  }
}

function fetchWithCookies(cookieJar, requestUrl, opts = {}) {
  const cookieHeaders = cookieJar.getHeaders(requestUrl)
  if (opts.headers) {
    Object.assign(opts.headers, cookieHeaders)
  } else {
    opts.headers = cookieHeaders
  }
  if (!opts.redirect) {
    opts.redirect = 'manual'
  }
  debug('fetchWithCookies %s %s', opts.method || 'GET', requestUrl)
  return fetch(requestUrl, opts)
    .then((response) => {
      cookieJar.setCookies(requestUrl, response.headers.getAll('set-cookie'))
      return [requestUrl, response]
    })
}

function oauthFlow (getCredential, cookieJar) {
  const fetchHelper = fetchWithCookies.bind(null, cookieJar)
  let maxRedirects = 10

  const mainController = function ([requestUrl, response]) {
    if (response.status === 302) {
      const redirectTo = response.headers.get('location')
      if (redirectTo === `${jenkinsBaseUrl}/`) {
        // redirected back to home page - means we completed the login flow!
        return true
      }
      debug('oauthFlow 302 redirect to %s', redirectTo)
      maxRedirects--
      if (maxRedirects >= 0) {
        return fetchHelper(redirectTo)
          .then(mainController)
      }
      debug('oauthFlow hit max redirect limit')
    } else if (response.ok) {
      if (requestUrl.includes('/login?client_id')) {
        return sendCredentials(fetchHelper, getCredential, requestUrl, response)
          .then(mainController)
      } else if (requestUrl.includes('/sessions/two-factor')) {
        return sendTwoFactor(fetchHelper, getCredential, requestUrl, response)
          .then(mainController)
      }
    }
    // else - likely some sort of error
    return Promise.all([
      response.status,
      requestUrl,
      response.text()
    ])
      .then(([status, requestUrl, body]) => {
        debug('oauthFlow unexpected response HTTP %d from %s', status, requestUrl)
        const err = new Error('Unexpected oauthFlow state')
        Object.assign(err, { status, requestUrl, body })
        throw err
      })
  }

  debug('oauth starting')
  return fetchHelper(urls.oauthEntry)
    .then(mainController)
}

function formArrayToFormData (formArray) {
  const asObj = formArray.reduce((out, {name, value}) => {
    out[name] = value
    return out
  })
  return querystring.stringify(asObj)
}

function sendCredentials (fetchHelper, getCredential, requestUrl, response) {
  return Promise.all([
    getCredential(requestUrl, 'username'),
    getCredential(requestUrl, 'password'),
    response.text()
  ])
    .then(([username, password, html]) => {
      const root = cheerio.load(html)
      const form = root('body').find('#login form')
      const pathname = form.attr('action')
      form.find('input[name=login]').val(username)
      form.find('input[name=password]').val(password)
      const body = formArrayToFormData(form.serializeArray())
      const { protocol, hostname } = url.parse(requestUrl)
      const postTo = url.format({ protocol, hostname, pathname })
      debug('sendCredentials to %s', postTo)
      const opts = {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
      return fetchHelper(postTo, opts)
    })
}
function sendTwoFactor (fetchHelper, getCredential, requestUrl, response) {
  return Promise.all([
      getCredential(requestUrl, '2fa'),
      response.text()
    ])
    .then(([twofactor, html]) => {
      const root = cheerio.load(html)
      const form = root('body').find('#login form')
      const pathname = form.attr('action')
      form.find('input[name=otp]').val(twofactor)
      const body = formArrayToFormData(form.serializeArray())
      const { protocol, hostname } = url.parse(requestUrl)
      const postTo = url.format({ protocol, hostname, pathname })
      debug('sendTwoFactor content \'%s\' to %s', body, postTo)
      const opts = {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
      return fetchHelper(postTo, opts)
    })
}

function testSession (headers) {
  const opts = {
    url: urls.homepageApi,
    method: 'GET',
    headers
  }
  return fetchRest(opts)
    .then((data) => {
      debug('testSession call succeed')
      return headers
    })
}

function cachedLogin (getCredential) {
  const cookieJar = makeCookieJar()

  const runOauthFlow = function () {
    return oauthFlow(getCredential, cookieJar)
      .then(() => {
        const headers = cookieJar.getHeaders(jenkinsBaseUrl)
        return testSession(headers)
      })
      .then((headers) => {
        cookieJar.saveTo(jenkinsCookieJarPath)
        debug('runOauthFlow cookieJar saved')
        return headers
      })
  }

  return cookieJar.loadFrom(jenkinsCookieJarPath)
    .then(() => {
      const headers = cookieJar.getHeaders(jenkinsBaseUrl)
      if (headers.cookie) {
        return testSession(headers)
          .catch((err) => {
            if (err.status !== 403) {
              throw err
            }
            debug('cachedLogin cookie stale, will initiate refresh')
            return runOauthFlow()
          })
      }
      debug('cachedLogin no cookie set, will initiate full login')
      return runOauthFlow()
    })
}

function withSession (getCredential) {
  return cachedLogin(getCredential)
    .then((headers) => partialProps(methods, headers))
}

module.exports = withSession
