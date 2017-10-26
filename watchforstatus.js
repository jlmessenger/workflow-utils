#!/usr/bin/env node
const initDebug = require('debug')
const { getJiraApi, logError } = require('./index')
const notification = require('./lib/notification')
const getArgs = require('./lib/get-args')

const debug = initDebug('watchforstatus')

const [ ticket ] = getArgs(__filename)

if (!ticket || ticket === '') {
  console.error('Missing required argument "ticket"')
  process.exit(1)
}

let currentStatus = ''

let notifyCount = 9999
const notificationsPerStatus = 2
const pollIntervalMin = 5

function handleNotification ({ key, fields: { summary, status } }) {
  debug('%s Status: %s', key, status.name)
  if (status.name !== currentStatus) {
    notifyCount++
    if (notifyCount > notificationsPerStatus) {
      notifyCount = 0
      currentStatus = status.name
    }
    return notification({ title: `${key} Changed Status`, subtitle: `Status: ${status.name}`, message: summary })
  }
}

function queueNextCheck() {
  setTimeout(checkStatusChange, pollIntervalMin * 60 * 1000)
}

function checkStatusChange () {
  return getJiraApi().then((jiraApi) => {
    return jiraApi.getTicket(ticket, { fields: 'summary,status' })
  })
    .then(handleNotification)
    .then(queueNextCheck)
    .catch(logError)
}

checkStatusChange()
