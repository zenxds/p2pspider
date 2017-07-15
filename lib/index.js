'use strict'
import EventEmitter from 'events'

import DHTSpider from './DHTSpider'
import BTClient from './BTClient'
import { debug } from './utils'

class P2PSpider extends EventEmitter {
  constructor(options = {}) {
    super()

    debug('options: %s', JSON.parse(options))
    this.options = options
    this.listen()
  }

  listen() {
    const btClient = new BTClient({
      timeout: this.options.timeout || 10000,
      maxConnections: this.options.maxConnections || 10,
      filter: this.options.filter
    })

    const dhtSpider = new DHTSpider({
      address: this.options.address || '0.0.0.0',
      port: this.options.port || 6881,
      bootstrapNodes: this.options.bootstrapNodes || [],
      maxNodesSize: this.options.maxNodesSize || 8
    })

    /**
     * bt下载完成
     */
    btClient.on('complete', (metadata, infohash, rinfo) => {
      infohash = infohash.toString('hex')

      this.emit('metadata', Object.assign({
        address: rinfo.address,
        port: rinfo.port,
        infohash: infohash,
        magnet: `magnet:?xt=urn:btih:${infohash}`
      }, metadata))
    })

    /**
     * 其他node声明开始下载资源的时候，加到bt下载队列里
     */
    dhtSpider.on('announcePeer', (rinfo, infohash) => {
      debug('btClient add %s', infohash.toString('hex'))
      btClient.add(rinfo, infohash)
    })

    dhtSpider.start()    
    // setInterval(() => {
    //   if (btClient.isFree()) {
    //   }
    // }, 1000)
    
    return this
  }
}

export default P2PSpider
