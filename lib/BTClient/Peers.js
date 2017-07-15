'use strict'
/**
 * 存储peers信息
 */
class Peers {
  constructor(limit=10) {
    // 每个资源存储的peer的最大个数
    this.limit = 10
    this.peers = {}
  }

  shift(infohash) {
    const infohashHex = infohash.toString('hex')
    const peers = this.peers[infohashHex]
    if (peers && peers.length > 0) {
      return peers.shift()
    } else {
      delete this.peers[infohashHex]
    }

    return null
  }

  push(peer) {
    const infohashHex = peer.infohash.toString('hex')
    const peers = this.peers[infohashHex] = this.peers[infohashHex] || []

    if (peers.length < this.limit) {
      peers.push(peer)
    }
  }
}

export default Peers
