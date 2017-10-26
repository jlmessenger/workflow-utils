const initDebug = require('debug')
const { readJsonFile, writeJsonFile } = require('./fs-json')
const { getHostname } = require('./utils')

const debug = initDebug('workflowUtils:cookieJar')

function cookiesArrayToObj (cookiesRaw) {
  return cookiesRaw.reduce((out, entry) => {
    // ignores path, domain, secure, httponly and other flags
    const [, name, val] = entry.match(/^([^=]+)=([^;]*)/)
    out[name] = val
    return out
  }, {})
}

function cookiesObjToStr (cookies) {
  return Object.keys(cookies).reduce((out, k) => {
    const v = cookies[k]
    out.push(`${k}=${v}`)
    return out
  }, []).join('; ')
}

function makeCookieJar () {
  const store = new Map();
  return {
    setCookies(forUrl, setCookieArray) {
      const hostname = getHostname(forUrl)
      if (!Array.isArray(setCookieArray) || setCookieArray.length === 0) {
        return;
      }
      const cookies = cookiesArrayToObj(setCookieArray)
      const existing = store.get(hostname)

      const combined = existing ? Object.assign({}, existing, cookies) : cookies
      debug('setCookies hostname=%s %O', hostname, combined)
      store.set(hostname, combined)
    },
    loadFrom(cachePath) {
      return readJsonFile(cachePath)
        .catch(() => {
          debug('loadFrom unable to read from %s', cachePath)
          return {}
        })
        .then((mapAsObj) => {
          Object.keys(mapAsObj).forEach((hostname) => {
            const cookies = mapAsObj[hostname]
            debug('loadFrom path=%s hostname=%s %O', cachePath, hostname, cookies)
            store.set(hostname, cookies)
          })
        })
    },
    saveTo(cachePath) {
      const mapAsObj = Array.from(store.entries()).reduce((out, [hostname, cookies]) => {
        out[hostname] = cookies
        return out
      }, {})
      debug('saveTo path=%s %O', cachePath, mapAsObj)
      return writeJsonFile(cachePath, mapAsObj)
    },
    getHeaders(forUrl) {
      const hostname = getHostname(forUrl)
      const cookies = store.get(hostname)
      if (!cookies) {
        debug('getHeaders hostname=%s {}', hostname)
        return {}
      }
      const cookie = cookiesObjToStr(cookies)
      const out = { cookie }
      debug('getHeaders hostname=%s %o', hostname, out)
      return out
    }
  }
}

module.exports = makeCookieJar
