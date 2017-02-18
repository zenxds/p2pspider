'use strict'
import EventEmitter from 'events'
import net from 'net'
import createDebug from 'debug'
import config from 'config'

import PeerQueue from './PeerQueue'
import Wire from './Wire'

const debug = createDebug('BTClient')
const btConfig = config.get('btConfig')

const DOWNLOAD = Symbol('download')
const NEXT = Symbol('next')

/**
 * bt download client
 */
class BTClient extends EventEmitter {
  constructor(options) {
    super()

    this.timeout = options.timeout || btConfig.timeout
    this.maxConnections = options.maxConnections || btConfig.maxConnections
    this.filters = options.filters
    this.activeConnections = 0
    this.peers = new PeerQueue(this.maxConnections)

    this.on('download', this[DOWNLOAD])
  }

  [DOWNLOAD](rinfo, infohash) {
    this.activeConnections++

    let successful = false
    const socket = new net.Socket()

    socket.setTimeout(this.timeout)
    socket.connect(rinfo.port, rinfo.address, () => {
      const wire = new Wire(infohash)
      socket.pipe(wire).pipe(socket)

      wire.on('metadata', (metadata, infoHash) => {
        successful = true
        this.emit('complete', metadata, infoHash, rinfo)
        socket.destroy()
      })

      wire.on('fail', () => {
        socket.destroy()
      })

      wire.sendHandshake()
    })

    socket.on('error', (err) => {
      socket.destroy()
    })

    socket.on('timeout', (err) => {
      socket.destroy()
    })

    socket.once('close', () => {
      this.activeConnections--
      this[NEXT](infohash, successful)
    })
  }

  [NEXT](infohash, successful) {
    const req = this.peers.shift(infohash, successful)
    if (!req) {
      return
    }

    const drop = this.filters.some((filter) => {
      return filter(req.infohash.toString('hex'), req.rinfo)
    })

    if (!drop) {
      this.emit('download', req.rinfo, req.infohash)
    }
  }

  add(rinfo, infohash) {
    this.peers.push({
      infohash: infohash,
      rinfo: rinfo
    })

    if (this.activeConnections < this.maxConnections && this.peers.length > 0) {
      this[NEXT]()
    }
  }

  isFree() {
    return this.peers.length == 0
  }
}

export default BTClient
