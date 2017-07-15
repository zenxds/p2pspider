'use strict'

import crypto from 'crypto'
import createDebug from 'debug'

export const debug = createDebug('P2PSpider')
debug.enabled = process.env.DEBUG === 'true'

/**
 * 随机一个20位的node id
 */
export function randomID() {
  return crypto.createHash('sha1').update(crypto.randomBytes(20)).digest()
}

/**
 * Contact information for peers is encoded as a 6-byte string. Also known as "Compact IP-address/port info" the 4-byte IP address is in network byte order with the 2 byte port in network byte order concatenated onto the end.
 * Contact information for nodes is encoded as a 26-byte string. Also known as "Compact node info" the 20-byte Node ID in network byte order has the compact IP-address/port info concatenated to the end.
 */
export function decodeNodes(data) {
  const nodes = []
  for (let i = 0; i + 26 <= data.length; i += 26) {
    nodes.push({
      nodeId: data.slice(i, i + 20),
      address: data.slice(i + 20, 24).join('.'),
      port: data.readUInt16BE(i + 24)
    })
  }
  return nodes
}

/**
 * 生成临近节点的ID
 * 高位越一样，代表两个节点位置越近
 */
export function genNeighborID(target, nid) {
  return Buffer.concat([target.slice(0, 10), nid.slice(10)])
}

/**
 * 转为驼峰写法
 */
export function camelize(str) {
  return str.replace(/[-_][^-_]/g, function(match) {
    return match.charAt(1).toUpperCase()
  })
}