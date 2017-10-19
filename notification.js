const child_process = require('child_process')

function collectStreamDataArray(stream) {
  const writes = []
  stream.on('data', (data) => {
    writes.push(data)
  })
  return writes
}

function saferArg (str) {
  return str.replace(/[^\w- \.]/g, '')
}

function notification ({ title, subtitle, message }) {
  return new Promise((resolve, reject) => {
    const cliArgs = [
      '-D', `title=${saferArg(title)}`,
      '-D', `subtitle=${saferArg(subtitle)}`,
      '-D', `message=${saferArg(message)}`,
      'notification.workflow'
    ]
    const proc = child_process.spawn('automator', cliArgs)
    const out = {
      stdout: collectStreamDataArray(proc.stdout),
      stderr: collectStreamDataArray(proc.stderr)
    }
    proc.on('close', (code) => {
      if (code === 0) {
        return resolve()
      }
      const err = new Error(`Process exited with code ${code}`)
      Object.assign(err, out)
      return reject(err)
    })
  })
}

module.exports = notification
