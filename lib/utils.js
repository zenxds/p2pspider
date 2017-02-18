'use strict'

import crypto from 'crypto'
import createDebug from 'debug'

export const debug = createDebug('P2PSpider')
debug.enabled = process.env.DEBUG === 'true'

export function randomID() {
  return crypto.createHash('sha1').update(crypto.randomBytes(20)).digest()
}

export function decodeNodes(data) {
  const nodes = [];
  for (let i = 0; i + 26 <= data.length; i += 26) {
    nodes.push({
      nid: data.slice(i, i + 20),
      address: data.slice(i + 20, 24).join('.'),
      port: data.readUInt16BE(i + 24)
    })
  }
  return nodes
}

export function genNeighborID(target, nid) {
  return Buffer.concat([target.slice(0, 10), nid.slice(10)])
}
