const fs = require('fs')

function readJsonFile (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf8' }, (err, contents) => {
      if (err) {
        return reject(err)
      }
      try {
        const data = JSON.parse(contents)
        resolve(data)
      } catch (ex) {
        return reject(ex)
      }
    })
  })
}

function writeJsonFile (path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, JSON.stringify(data, null, '  '), { encoding: 'utf8' }, (err) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}

module.exports = { readJsonFile, writeJsonFile }
