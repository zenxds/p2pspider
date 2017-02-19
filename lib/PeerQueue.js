'use strict'

class PeerQueue {
  constructor(maxsize = 200, perLimit = 10) {
    this.maxsize = maxsize
    this.perLimit = perLimit
    this.reqs = []
    this.peers = {}
  }

  get length() {
    return this.reqs.length
  }

  _shift() {
    if (this.length > 0) {
      const req = this.reqs.shift()
      this.peers[req.infohash.toString('hex')] = []
      return req
    }
  }

  shift(infohash, successful) {
    if (infohash) {
      const infohashHex = infohash.toString('hex')
      if (successful === true) {
        delete this.peers[infohashHex]
      } else {
        const peers = this.peers[infohashHex]
        if (peers) {
          if (peers.length > 0) {
            return peers.shift()
          } else {
            delete this.peers[infohashHex]
          }
        }
      }
    }
    return this._shift()
  }

  push(peer) {
    const infohashHex = peer.infohash.toString('hex')
    const peers = this.peers[infohashHex]

    if (peers && peers.length < this.perLimit) {
      peers.push(peer)
    } else if (this.length < this.maxsize) {
      this.reqs.push(peer)
    }
  }
}

export default PeerQueue
