'use strict'
import config from 'config'
import redis from 'redis-promisify'
import P2PSpider from '../lib'
import {
  Resource,
  ResourceEn
} from './model'

const redisClient = redis.createClient(config.get('redis'))
const btConfig = config.get('btConfig')
const dhtConfig = config.get('dhtConfig')
const getResource = async(infohash, isCN) => {
  const resource = await [isCN ? Resource : ResourceEn].findOne({
    where: {
      infohash: infohash
    }
  })
  if (resource) {
    await resource.increment('score', { by: 1 })
    return resource
  }
}

const p2p = new P2PSpider({
  address: dhtConfig.address,
  port: dhtConfig.port,
  bootstrapNodes: dhtConfig.bootstrapNodes,
  maxNodesSize: dhtConfig.maxNodesSize,
  replyFindNode: dhtConfig.replyFindNode,
  maxConnections: btConfig.maxConnections,
  timeout: btConfig.timeout,
  filter: async(infohash) => {
    let resource

    resource = await getResource(infohash, true)
    if (resource) {
      return true
    }

    resource = await getResource(infohash, false)
    if (resource) {
      return true
    }

    return false
  }
})

/**
 * infohash
 * magnet
 * address
 * port
 * info.name
 * info.files
 * info.piece length
 * info.pieces
 */
const RESOURCE_EN = 'resource_en'
const RESOURCE_CN = 'resource_cn'
p2p.on('metadata', async(metadata) => {
  const name = metadata.info.name.toString('utf8')

  const isCN = /[\u4e00-\u9fa5]/.test(name)
  await redisClient.hsetAsync(isCN ? RESOURCE_CN : RESOURCE_EN, metadata.infohash, '1')
  
  const [resource, created] = await [isCN ? Resource : ResourceEn].findOrCreate({
    where: {
      infohash: metadata.infohash
    },

    defaults: {
      magnet: metadata.magnet,
      name: name,
      score: 0
    }
  })

  if (!created) {
    // 多次下载的资源分数 + 1
    await resource.increment('score', { by: 1 })
  }
})