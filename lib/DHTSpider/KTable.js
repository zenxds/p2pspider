'use strict'

/**
 * 路由表，有个K桶的概念
 * 存储其他node的信息
 */
export default class KTable {
  constructor(maxsize) {
    this.maxsize = maxsize
    this.nodes = []    
  }

  push(node) {
    if (this.nodes.length >= this.maxsize) {
      return
    }
    this.nodes.push(node)
  }
}
