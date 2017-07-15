'use strict'
import EventEmitter from 'events'
import net from 'net'
import Protocol from 'bittorrent-protocol'
import ut_metadata from 'ut_metadata'

import Peers from './Peers'
import { debug, randomID } from '../utils'

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
      const wire = new Protocol()
      socket.pipe(wire).pipe(socket)

      wire.use(ut_metadata())
      wire.ut_metadata.fetch()
      wire.ut_metadata.on('metadata', (metadata) => {
        this.emit('metadata', metadata, infohash, rinfo)
        socket.destroy()
      })

      wire.ut_metadata.on('warning', (err) => {
        debug('ut_metadata warning: %s', err.message)
        wire.destroy()        
        socket.destroy()
      })

      wire.handshake(Buffer.from(infohash), Buffer.from(randomID()))      
    })

    socket.on('error', (err) => {
      socket.destroy()
    })
    socket.on('timeout', (err) => {
      socket.destroy()
    })
    socket.once('close', () => {
      this.activeConnections--
      this.peers.remove(infohash)
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
      } else {
       this.peers.remove(infohash)
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
