'use strict'
import EventEmitter from 'events'
import bencode from 'bencode'

import DHTSpider from './DHTSpider'
import BTClient from './BTClient'
import { debug } from './utils'

class P2PSpider extends EventEmitter {
  constructor(options = {}) {
    super()

    debug('options: %s', JSON.stringify(options))
    this.options = options
    this.listen()
  }

  listen() {
    const options = this.options
    const btClient = new BTClient({
      timeout: options.timeout || 10000,
      maxConnections: options.maxConnections || 10,
      filter: options.filter
    })

    const dhtSpider = new DHTSpider({
      address: options.address || '0.0.0.0',
      port: options.port || 6881,
      bootstrapNodes: options.bootstrapNodes || [],
      maxNodesSize: options.maxNodesSize || 8,
      replyFindNode: typeof options.replyFindNode === 'undefined' ? false : options.replyFindNode
    })

    btClient.on('metadata', (metadata, infohash, rinfo) => {
      metadata = bencode.decode(metadata)

      this.emit('metadata', Object.assign({
        infohash: infohash.toString('hex'),
        magnet: `magnet:?xt=urn:btih:${infohash.toString('hex')}`
      }, metadata))
    })

    /**
     * 其他node声明开始下载资源的时候，加到bt下载队列里
     */
    dhtSpider.on('announcePeer', (infohash, rinfo) => {
      btClient.add(infohash, rinfo)
    })
    
    return this
  }
}

export default P2PSpider
