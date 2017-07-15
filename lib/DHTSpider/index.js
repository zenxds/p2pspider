'use strict'
import dgram from 'dgram'
import EventEmitter from 'events'
import bencode from 'bencode'

import KTable from './KTable'
import {
  debug,
  genNeighborID,
  decodeNodes,
  randomID,
  camelize
} from '../utils'



/**
 * dht spider
 */
export default class DHTSpider extends EventEmitter {
  constructor(options) {
    super()

    this.port = options.port
    this.address = options.address
    this.bootstrapNodes = options.bootstrapNodes
    this.table = new KTable(options.maxNodesSize)
    this.nodeId = randomID()
    this.bind()
  }

  bind() {
    const socket = this.socket = dgram.createSocket('udp4')    
    
    socket.on('listening', () => {
      debug('UDP Server listening on %s:%s', this.address, this.port)
    })

    socket.on('message', (msg, rinfo) => {
      this.onMessage(msg, rinfo)
    })

    socket.on('error', (err) => {
      debug('dht socket error: %s', err)
    })

    socket.bind(this.port, this.address)
  }

  start() {
    this.joinDHTNetwork()
    this.makeNeighbours()
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

    if (msg.y == 'r') {
      this.onResponse(msg)
    } else if (msg.y == 'q') {
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
    const q = msg.q.toString('utf8')
    const method = camelize(`on_${q}_request`)

    if (this[method]) {
      this[method](msg, rinfo)
    }
  }

  onPingRequest(msg, rinfo) {
    this.sendKRPC({
      t: msg.t,
      y: 'r',
      r: {
        id: this.nodeId
      }
    }, rinfo)
  }

  /**
   * 用来获取想要下载资源的节点的信息
   */
  onGetPeersRequest(msg, rinfo) {
    const infohash = msg.a.info_hash

    this.sendKRPC({
      t: msg.t,
      y: 'r',
      r: {
        id: genNeighborID(infohash, this.nodeId),
        nodes: '',
        token: getToken(infohash)
      }
    }, rinfo)
  }

  onAnnouncePeerRequest(msg, rinfo) {
    const infohash = msg.a.info_hash
    const token = msg.a.token + ''
    const nodeId = msg.a.id
    const port = msg.a.implied_port ? rinfo.port : msg.a.port

    if (getToken(infohash) !== token || !isValidatePort(port)) {
      return
    }

    this.sendKRPC({
      t: msg.t,
      y: 'r',
      r: {
        id: genNeighborID(nodeId, this.nodeId)
      }
    }, rinfo)

    this.emit('announcePeer', infohash, {
      address: rinfo.address,
      port: port
    })
  }

  /**
   * 返回目标node信息
   * 否则返回距离自己最近的八个node信息
   */
  onFindNodeRequest(msg, rinfo) {
    this.sendKRPC({
      t: msg.t,
      y: 'r',
      r: {
        id: genNeighborID(msg.a.id, this.nodeId),
        nodes: ''
      }
    }, rinfo)
  }

  onFindNodeResponse(nodes) {
    nodes = decodeNodes(nodes)
    nodes.forEach((node) => {
      // 收到对方距离最近的8个节点后要过滤掉自身节点
      if (node.nodeId != this.nodeId && isValidatePort(node.port)) {
        this.table.push(node)
      }
   })
  }

  /**
   * 用于查找某个节点，以获得其地址信息
   */
  findNode(rinfo, nodeId) {
    const msg = {
      t: getTransactionID(),
      y: 'q',
      q: 'find_node',
      a: {
        id: nodeId ? genNeighborID(nodeId, this.nodeId) : this.nodeId,
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
    this.bootstrapNodes.forEach((item) => {
      this.findNode({
        address: item[0],
        port: item[1]
      })
    })
  }

  makeNeighbours() {
    this.table.nodes.forEach((node) => {
      this.findNode({
        address: node.address,
        port: node.port
      }, node.nodeId)
    })
    this.table.nodes = []
  }
}

function isValidatePort(port) {
  return port > 0 && port < 65536
}
/*
 * transaction ID，标示查询用，位数自己定义
 */
const getTransactionID = () => {
  return randomID().slice(0, 4)
}

/**
 * short binary string
 */
const TOKEN_LENGTH = 2
function getToken(infohash) {
  return infohash.toString().slice(0, TOKEN_LENGTH)
}