'use strict'
import EventEmitter from 'events'
import net from 'net'

import Peers from './Peers'
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
    this.filter = options.filter || defaultFilter

    this.requests = []
    this.maxConnections = options.maxConnections    
    this.activeConnections = 0
    this.peers = new Peers()

    setInterval(() => {
      if (this.requests.length) {
        this.request(this.requests.shift())
      }
    }, 1000)
  }

  download(infohash, rinfo) {
    this.activeConnections++

    const socket = new net.Socket()
    socket.setTimeout(this.timeout)
    socket.connect(rinfo.port, rinfo.address, () => {
      const wire = new Wire(infohash)
      socket.pipe(wire).pipe(socket)

      wire.on('metadata', (metadata, infohash) => {
        this.emit('complete', metadata, infohash, rinfo)
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
      
      // delete peer from peers
      this.request(infohash)
    })
  }

  request(infohash) {
    const peer = this.peers.shift(infohash)
    if (!peer) {
      return
    }
    
    const infohashHex = infohash.toString('hex')
    this.filter(infohashHex, peer.rinfo).then((drop) => {
      if (!drop) {
        debug('download %s', infohashHex)
        this.download(peer.infohash, peer.rinfo)
      }
    }).catch((err) => {
      debug('filter error: %s', err)
    })
  }

  add(infohash, rinfo) {
    this.peers.push({
      infohash: infohash,
      rinfo: rinfo
    })

    if (this.activeConnections < this.maxConnections) {
      this.requests.push(infohash)
    }
  }
}

export default BTClient
