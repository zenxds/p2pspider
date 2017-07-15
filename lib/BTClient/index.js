'use strict'
import EventEmitter from 'events'
import net from 'net'

import PeerQueue from './PeerQueue'
import Wire from './Wire'
import { debug } from '../utils'

const DOWNLOAD = Symbol('download')
const NEXT = Symbol('next')
const defaultFilter = async() => { return false }

/**
 * bt download client
 */
class BTClient extends EventEmitter {
  constructor(options) {
    super()

    this.timeout = options.timeout
    this.maxConnections = options.maxConnections
    this.filter = options.filter || defaultFilter
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

    this.filter(req.infohash.toString('hex'), req.rinfo).then((drop) => {
      if (!drop) {
        debug('download %s', req.infohash.toString('hex'))
        this.emit('download', req.rinfo, req.infohash)
      }
    }).catch((err) => {
      debug('filter error: %s', err)
    })
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
    return this.peers.length === 0
  }
}

export default BTClient
