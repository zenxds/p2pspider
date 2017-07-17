'use strict'
import EventEmitter from 'events'
import net from 'net'
import Protocol from 'bittorrent-protocol'
import ut_metadata from 'ut_metadata'

import { debug, randomID } from '../utils'

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
    this.requests = []
    
    setInterval(() => {
      if (this.requests.length) {
        this.request(this.requests.shift())
      }
    }, 1000)
  }

  download(infohash, rinfo) {
    const socket = new net.Socket()
    socket.setTimeout(this.timeout)

    socket.on('error', (err) => {
      socket.destroy()
    })
    socket.on('timeout', (err) => {
      socket.destroy()
    })
    socket.on('close', () => {
      this.activeConnections--
    })

    socket.connect(rinfo.port, rinfo.address, () => {
      const wire = new Protocol()
      socket.pipe(wire).pipe(socket)

      wire.use(ut_metadata())
      wire.ut_metadata.fetch()
      wire.ut_metadata.on('metadata', (metadata) => {
        this.emit('metadata', metadata, infohash, rinfo)
        wire.destroy()              
        socket.destroy()
      })

      wire.ut_metadata.on('warning', (err) => {
        debug('ut_metadata warning: %s', err.message)
        wire.destroy()        
        socket.destroy()
      })
      wire.on('handshake', function (infoHash, peerId) {
        debug('handshake')
        wire.handshake(Buffer.from(infohash), Buffer.from(randomID()))      
      })
    })
  }

  request(peer) {
    const infohash = peer.infohash
    const infohashHex = infohash.toString('hex')

    this.filter(infohashHex).then((drop) => {
      if (!drop) {
        debug('download %s', infohashHex)
        this.download(infohash, peer.rinfo)
      } else {
        this.activeConnections--        
      }
    }).catch((err) => {
      debug('filter error: %s', err)
      this.activeConnections--
    })
  }

  add(infohash, rinfo) {
    if (this.activeConnections < this.maxConnections) {
      debug('btClient request add %s', infohash.toString('hex'))
      this.requests.push({
        infohash: infohash,
        rinfo: rinfo
      })
      this.activeConnections++
    }
  }
}

export default BTClient
