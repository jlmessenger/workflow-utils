const fetch = require('node-fetch')
const { without } = require('./utils')

class ResponseError extends Error {
  constructor(requestUrl, status, body) {
    super(`HTTP ${status}`)
    Object.assign(this, { requestUrl, status, body })
  }
}

function jsonResponse ([requestUrl, response]) {
  if (response.ok) {
    return response.json()
  }
  return Promise.all([requestUrl, response.status, response.text()])
    .then((args) => {throw new ResponseError(...args)})
}

function fetchRest (args) {
  const requestUrl = args.url
  const opts = without(args, 'url')
  if (['POST', 'PUT'].includes(opts.method)) {
    opts.headers = opts.headers || {}
    opts.headers['Content-Type'] = 'application/json'
    if (opts.body && typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body)
    }
  }
  return Promise.all([
    requestUrl,
    fetch(requestUrl, opts)
  ])
    .then(jsonResponse)
}

fetchRest.ResponseError = ResponseError

module.exports = fetchRest
