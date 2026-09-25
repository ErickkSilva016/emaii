'use strict'

const fs = require('node:fs')
const path = require('node:path')

function requiredUrl(name) {
  const value = (process.env[name] || '').trim()
  if (!value) throw new Error(`Set the Netlify environment variable ${name}.`)

  let parsed
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${name} must be an absolute URL.`)
  }

  if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    throw new Error(`${name} must use HTTPS outside local development.`)
  }

  return value
}

const config = {
  API_URL: requiredUrl('API_URL'),
}
const output = path.join(__dirname, 'dist')

fs.rmSync(output, { recursive: true, force: true })
fs.mkdirSync(output, { recursive: true })
for (const entry of ['index.html', 'css', 'js', 'assets']) {
  fs.cpSync(path.join(__dirname, entry), path.join(output, entry), { recursive: true })
}
fs.writeFileSync(
  path.join(output, 'config.js'),
  `window.EMAII_CONFIG = Object.freeze(${JSON.stringify(config)});\n`,
  'utf8'
)

console.log('EMAII frontend built into frontend/dist')
