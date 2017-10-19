const fetch = require('node-fetch')
const { without } = require('./utils')

class ResponseError extends Error {
  constructor(status, body) {
    super(`HTTP ${status}`)
    Object.assign({ status, body })
  }
}

function jsonResponse (response) {
  const jsonPromise = response.json()
  if (response.ok) {
    return jsonPromise
  }
  return Promise.all([response.status, jsonPromise])
    .then((args) => {throw new ResponseError(...args)})
}

function fetchRest (args) {
  const opts = without(args, 'url')
  return fetch(args.url, opts).then(jsonResponse)
}

fetchRest.ResponseError = ResponseError

module.exports = fetchRest
