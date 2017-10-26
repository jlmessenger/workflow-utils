function without (obj, ...keys) {
  return Object.keys(obj).reduce((copy, name) => {
    if (!keys.includes(name)) {
      copy[name] = obj[name]
    }
    return copy
  }, {})
}

function partialProps (obj, ...args) {
  return Object.keys(obj).reduce((copy, name) => {
    copy[name] = obj[name].bind(null, ...args)
    return copy
  }, {})
}

function getHostname (urlStr) {
  return urlStr.match(/^https?:\/\/([\w-\.]+)\/?/)[1]
}

module.exports = { partialProps, without, getHostname }
