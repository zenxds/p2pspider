'use strict'
import config from 'config'
import P2PSpider from '../lib'
import Resource from './model'

const btConfig = config.get('btConfig')
const dhtConfig = config.get('dhtConfig')
const p2p = new P2PSpider({
  address: dhtConfig.address,
  port: dhtConfig.port,
  bootstrapNodes: dhtConfig.bootstrapNodes,
  maxNodesSize: dhtConfig.maxNodesSize,
  maxConnections: btConfig.maxConnections,
  timeout: btConfig.timeout,
  filter: async(infohash) => {
    const resource = await Resource.findOne({
      where: {
        infohash: infohash
      }
    })
    return !!resource
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
  // metadata = bencode.decode(metadata)
  // console.log(metadata)
  // const name = metadata.info.name.toString('utf8')

  // // 只保存中文资源
  // if (!/[\u4e00-\u9fa5]/.test(name)) {
  //   return
  // }
  
  // const [instance, created] = await Resource.findOrCreate({
  //   where: {
  //     infohash: metadata.infohash
  //   },

  //   defaults: {
  //     magnet: metadata.magnet,
  //     name: name,
  //     score: 0
  //   }
  // })

  // if (!created) {
  //   // 多次下载的资源分数 + 1
  //   await instance.update({
  //     score: instance.get('score') + 1
  //   })
  // }
})