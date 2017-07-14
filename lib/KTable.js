'use strict';

import { randomID } from './utils'

/**
 * 存储其他node的信息
 */
export default class KTable {
  constructor(maxsize) {
    this.nid = randomID()
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
