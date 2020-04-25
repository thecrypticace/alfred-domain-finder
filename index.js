#!/usr/local/bin/node

// Yeah I know request is deprecated
// But it makes the cookie jar super easy
const request = require("request")
const providers = require("./providers")

async function main () {
  try {
    const domains = await findDomains()
    const items = domains.map(d => ({
      valid: true,
      uid: d.domain,
      title: d.domain,
      subtitle: d.provider,
      autocomplete: d.domain,
      arg: d.provider_url,
      icon: {
        type: "file",
        path: "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/BookmarkIcon.icns",
      }
    }))

    await display(items)
  } catch (err) {
    if (err.error_code === "login") {
      err = "Please provide a new hover auth cookie"
    } else if (err.error) {
      err = err.error
    }

    await display([
      {
        valid: false,
        uid: "err",
        title: `${err}`,
      },
    ])
  }
}

/**
 * @return {Promise<Domain[]>
 */
async function findDomains () {
  const results = await Promise.all([
    findDomainsOnHover(),
  ])

  return results.flat()
}

/**
 * @return {Promise<Domain[]>
 */
async function findDomainsOnHover () {
  const provider = providers.hover

  if (provider.cookies.length > 0) {
    // OK
  }  else if (provider.username && provider.password) {
    throw new Error("Username and password not yet supported")
  } else {
    throw new Error("Please specify cookies or username/password")
  }

  // Create request wrapper, enabling json and cookies
  const jar = request.jar()

  provider.cookies.forEach(cookie => {
    jar.setCookie(cookie, "https://www.hover.com")
  })

  const r = request.defaults({
    baseUrl: "https://www.hover.com/api/",
    jar,
    json: true,
  })

  /**
   * @param {string} path
   * @param {import("request").CoreOptions} opts
   **/
  const req = async function (path, opts = {}) {
    return new Promise((resolve, reject) => {
      r(path, opts, function (err, res, data) {
        if (err) {
          reject(err)
        } else if (!res || res.statusCode > 400) {
          reject(data)
        } else {
          resolve(data)
        }
      })
    })
  }

  // Log in to hover
  if (!provider.cookies.length) {
    await req("login", {
      method: "POST",
      body: {
        username: provider.username,
        password: provider.password,
      },
      headers: {
        "Content-Type": "application/json"
      }
    })
  }

  // Get list of domains
  const response = await req("/domains")

  return response.domains.map(item => ({
    domain: item.domain_name,
    provider: "hover",
    provider_url: `https://www.hover.com/control_panel/domain/${item.domain_name}`,
  }))
}

async function display(items) {
  console.log(JSON.stringify({
    items,
  }))
}

main()

/** @typedef {"hover"} Provider */

/**
 * @typedef {object} Domain
 * @property {Provider} provider
 * @property {string} domain
 * @property {string} provider_url
 **/
