'use strict'
import config from 'config'
import redis from 'redis-promisify'
import P2PSpider from '../lib'
import Resource from './model'

const redisClient = redis.createClient(config.get('redis'))
const RESOURCE_EN = 'resource_en'

const btConfig = config.get('btConfig')
const dhtConfig = config.get('dhtConfig')
const p2p = new P2PSpider({
  address: dhtConfig.address,
  port: dhtConfig.port,
  bootstrapNodes: dhtConfig.bootstrapNodes,
  maxNodesSize: dhtConfig.maxNodesSize,
  replyFindNode: dhtConfig.replyFindNode,
  maxConnections: btConfig.maxConnections,
  timeout: btConfig.timeout,
  filter: async(infohash) => {
    const resource = await Resource.findOne({
      where: {
        infohash: infohash
      }
    })
    if (resource) {
      await resource.increment('score', { by: 1 })
      return true
    }

    // 是英文资源
    const isEn = await redisClient.hexistsAsync(RESOURCE_EN, infohash)
    if (isEn) {
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
p2p.on('metadata', async(metadata) => {
  const name = metadata.info.name.toString('utf8')

  // 只保存中文资源，同时记录该infohash为英文
  if (!/[\u4e00-\u9fa5]/.test(name)) {
    await redisClient.hsetAsync(RESOURCE_EN, metadata.infohash, '1')
    return
  }
  
  const [resource, created] = await Resource.findOrCreate({
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