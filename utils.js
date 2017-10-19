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

module.exports = { partialProps, without }