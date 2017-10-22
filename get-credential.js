const notification = require('./notification')
const { getHostname } = require('./utils')
const { readJsonFile } = require('./fs-json')
const { askStdin, askSecretStdin } = require('./stdin-ask')
const { credentialPrefill, credentials: { file: credentialsFile, protectedKeys, showNotification } } = require('./config')

function askNotice (askFn, message) {
  return notification({ title: 'CLI Ask', subtitle: 'Your input is needed', message })
    .then(() => askFn(message))
}

let previousPrompt = Promise.resolve()

function getCredential (requestUrl, key) {
  const hostname = getHostname(requestUrl)
  const found = credentialPrefill[`${hostname}:${key}`]
  if (found) {
    return found
  }
  const question = `${hostname} ${key}:`
  const askFn = protectedKeys.includes(key) ? askSecretStdin : askStdin
  const method = showNotification ? askNotice.bind(null, askFn, question) : askFn.bind(null, question)
  // ensure prompt always waits for previous
  return previousPrompt = previousPrompt.then(method)
}

module.exports = getCredential
