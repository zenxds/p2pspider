'use strict'
import EventEmitter from 'events'

import DHTSpider from './DHTSpider'
import BTClient from './BTClient'
import { debug } from './utils'

/*
 * private variable
 */
const FILTER = Symbol('filter')

class P2PSpider extends EventEmitter {
  constructor(options = {}) {
    super()

    this.options = options
  }

  filter(fn) {
    if (typeof fn === 'function') {
      this[FILTER] = fn
    }
    return this
  }

  listen(port, address) {

    const btClient = new BTClient({
      timeout: this.options.timeout,
      maxConnections: this.options.maxConnections,
      filter: this[FILTER]
    })

    btClient.on('complete', (metadata, infohash, rinfo) => {
      infohash = infohash.toString('hex')

      this.emit('metadata', Object.assign({
        address: rinfo.address,
        port: rinfo.port,
        infohash: infohash,
        magnet: `magnet:?xt=urn:btih:${infohash}`
      }, metadata))
    })

    const dhtSpider = new DHTSpider({
      btClient: btClient,
      address: address,
      port: port,
      nodesMaxSize: this.options.nodesMaxSize
    })
    dhtSpider.start()

    return this
  }
}

export default P2PSpider
