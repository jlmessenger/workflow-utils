const readline = require('readline')
const { Writable } = require('stream')

const nullStdout = new Writable({
  write(chunk, encoding, callback) {
    callback()
  }
})

function askStdin (ask) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  })
  return new Promise((resolve, reject) => {
    rl.once('close', reject)
    rl.question(`${ask} `, (answer) => {
      rl.removeListener('close', reject)
      rl.close()
      resolve(answer)
    })
  })
}

function askSecretStdin (ask) {
  const rl = readline.createInterface({
    historySize: 0,
    input: process.stdin,
    output: nullStdout,
    terminal: true
  })
  return new Promise((resolve, reject) => {
    rl.once('close', reject)
    process.stdout.write(`${ask} `, 'utf8')
    rl.question('', (answer) => {
      rl.removeListener('close', reject)
      process.stdout.write('\n')
      rl.close()
      resolve(answer)
    })
  })
}

module.exports = { askStdin, askSecretStdin }
