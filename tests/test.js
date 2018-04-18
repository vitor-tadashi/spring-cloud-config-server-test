'use strict'

const Client = require('..')
const https = require('https')
const assert = require('assert')
const HTTPS_ENDPOINT = 'https://raw.githubusercontent.com/vitor-tadashi/spring-cloud-config-server-test/master/files/config.json'

let lastURL = null

function basicAssertions (config) {
  assert.strictEqual(lastURL, '/application/test%2Ctimeout')
  assert.strictEqual(config.get('key01'), 'value01')
  assert.strictEqual(config.get('key02'), 2)
  assert.strictEqual(config.get('key03'), null)
  assert.strictEqual(config.get('missing'), undefined)
  assert.strictEqual(config.get('key04.key01'), 42)
  assert.strictEqual(config.get('key04', 'key01'), 42)
}

function httpsSimpleTest () {
  return Client.load({
    endpoint: HTTPS_ENDPOINT,
    rejectUnauthorized: false,
    profiles: ['test', 'timeout'],
    name: 'application'
  }).then(basicAssertions)
}

function httpsWithAgent () {
  const agent = new https.Agent()
  const old = agent.createConnection.bind(agent)
  let used = false
  agent.createConnection = function (options, callback) {
    used = true
    return old(options, callback)
  }
  return Client.load({
    endpoint: HTTPS_ENDPOINT,
    rejectUnauthorized: false,
    profiles: ['test', 'timeout'],
    name: 'application',
    agent
  }).then(basicAssertions)
    .then(() => {
      assert(used, 'Agent must be used in the call')
      agent.destroy()
    })
}

function httpsRejectionTest () {
  return Client.load({
    endpoint: HTTPS_ENDPOINT,
    profiles: ['test', 'timeout'],
    name: 'application'
  }).then(() => {
    throw new Error('No exception')
  }, () => {}) // just ignore
}

function proccessError (e) {
  console.error(e)
  process.exitCode = 1
}

Promise.resolve()
  .then(httpsSimpleTest)
  .then(httpsRejectionTest)
  .then(httpsWithAgent)
  .then(() => console.log('HTTPS OK :D'))
  .catch(proccessError);