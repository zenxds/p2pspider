'use strict'

import dgram from 'dgram'
import bencode from 'bencode'
import config from 'config'

import {
  debug,
  genNeighborID,
  decodeNodes,
  randomID
} from './utils'
import KTable from './KTable'

const dhtConfig = config.get('dhtConfig')
/*
 * transaction ID，标示查询用，位数自己定义
 */
const getToken = () => {
  return randomID().slice(0, 4)
}
/**
 * short binary string
 */
const TOKEN_LENGTH = 2


/**
 * dht spider
 */
export default class DHTSpider {
  constructor(options) {
    this.btClient = options.btClient
    this.port = options.port || dhtConfig.get('port')
    this.address = options.address || dhtConfig.get('address')
    this.socket = dgram.createSocket('udp4')
    this.ktable = new KTable(options.nodesMaxSize || dhtConfig.nodesMaxSize)
  }

  start() {

    this.socket.on('listening', () => {
      debug('UDP Server listening on %s:%s', this.address, this.port)
    })

    this.socket.on('message', (msg, rinfo) => {
      this.onMessage(msg, rinfo)
    })

    this.socket.on('error', (err) => {
      debug('dht socket error: %s', err)
    })

    this.socket.bind(this.port, this.address)

    setInterval(() => {
      if (this.btClient.isFree()) {
        this.joinDHTNetwork()
        this.makeNeighbours()
      }
    }, 1000)
  }

  /**
   * KRPC 协议是一个简单的 RPC 通信框架，其在 UDP 上使用 bencoded 编码的字典，包含请求与回复，但没有重试。
   * 有三种消息类型：query, response, error。
   * 对于 DHT 协议来说，有 4 种 query: ping, find_node, get_peers, announce_peer
   */
  sendKRPC(msg, rinfo) {
    try {
      const buf = bencode.encode(msg)
      this.socket.send(buf, 0, buf.length, rinfo.port, rinfo.address)
    } catch(err) {}
  }

  onMessage(msg, rinfo) {
    try {
      msg = bencode.decode(msg)
    } catch(err) {
      return
    }

    if (msg.y === 'r') {
      this.onResponse(msg)
    } else if (msg.y === 'q') {
      this.onRequest(msg, rinfo)
    }
  }

  onResponse(msg) {
    /**
     * 本爬虫只会发送find_node请求，所以响应这一个就够了
     */
    if (msg.r.nodes) {
      this.onFindNodeResponse(msg.r.nodes)
    }
  }

  onRequest(msg, rinfo) {
    const q = msg.q

    switch (q) {
      case 'ping':
        return this.onPingRequest(msg, rinfo)
      case 'find_node':
        return this.onFindNodeRequest(msg, rinfo)
      case 'get_peers':
        return this.onGetPeersRequest(msg, rinfo)
      case 'announce_peer':
        return this.onAnnouncePeerRequest(msg, rinfo)
    }
  }

  onPingRequest(msg, rinfo) {

  }

  /**
   * 用来获取想要下载资源的节点的信息
   */
  onGetPeersRequest(msg, rinfo) {
    const infohash = msg.a.info_hash
    const token = infohash.slice(0, TOKEN_LENGTH)

    this.sendKRPC({
      t: msg.t,
      y: 'r',
      r: {
        id: genNeighborID(msg.a.id, this.ktable.nid),
        nodes: '',
        token: token
      }
    }, rinfo)
  }

  onAnnouncePeerRequest(msg, rinfo) {
    const infohash = msg.a.info_hash
    const token = msg.a.token
    const port = msg.a.implied_port ? rinfo.port : msg.a.port

    if (infohash.slice(0, TOKEN_LENGTH).toString() != token.toString()) {
      return
    }

    if (port >= 65536 || port <= 0) {
      return
    }

    this.sendKRPC({
      t: msg.t,
      y: 'r',
      r: {
        id: genNeighborID(msg.a.id, this.ktable.nid)
      }
    }, rinfo)

    debug('btClient add %s', infohash.toString('hex'))
    this.btClient.add({
      address: rinfo.address,
      port: port
    }, infohash)
  }

  /**
   * 返回目标node信息
   * 否则返回距离自己最近的八个node信息
   */
  onFindNodeResquest(msg, rinfo) {

  }

  onFindNodeResponse(nodes) {
    nodes = decodeNodes(nodes)
    nodes.forEach((node) => {
      if (node.address != this.address && node.nid != this.ktable.nid && node.port < 65536 && node.port > 0) {
        this.ktable.push(node)
      }
   })
  }

  /**
   * 用于查找某个节点，以获得其地址信息
   */
  findNode(rinfo, nid) {
    const msg = {
      t: getToken(),
      y: 'q',
      q: 'find_node',
      a: {
        id: nid ? genNeighborID(nid, this.ktable.nid) : this.ktable.nid,
        // 只是为了获取到更多的node，target随机即可
        target: randomID()
      }
    }

    this.sendKRPC(msg, rinfo)
  }

  /**
   * 如何加入DHT网络？
   * 我们可以向网络上那些公共的节点发送find_node请求
   * 那些公共节点就会给我们回复一些节点的信息
   * 我们就可以获取到一些节点
   * 然后我们继续对获取到的这些节点发送find_node请求，从而认识更多的节点
   */
  joinDHTNetwork() {
    dhtConfig.bootstrapNodes.forEach((item) => {
      this.findNode({
        address: item[0],
        port: item[1]
      })
    })
  }

  makeNeighbours() {
    this.ktable.nodes.forEach((node) => {
      this.findNode({
        address: node.address,
        port: node.port
      }, node.nid)
    })
    this.ktable.nodes = []
  }
}
