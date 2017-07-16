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
    const btClient = new BTClient({
      timeout: this.options.timeout || 10000,
      maxConnections: this.options.maxConnections || 40,
      filter: this.options.filter
    })

    const dhtSpider = new DHTSpider({
      address: this.options.address || '0.0.0.0',
      port: this.options.port || 6881,
      bootstrapNodes: this.options.bootstrapNodes || [],
      maxNodesSize: this.options.maxNodesSize || 32,
      replyFindNode: this.options.replyFindNode
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
      debug('btClient add %s', infohash.toString('hex'))
      btClient.add(infohash, rinfo)
    })
    
    return this
  }
}

export default P2PSpider
