'use strict'
import P2PSpider from '../lib'
import Resource from './model'

const p2p = new P2PSpider()

p2p.filter(async (infohash, rinfo) => {
  const resource = await Resource.findOne({
    where: {
      infohash: infohash
    }
  })
  return !resource
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
p2p.on('metadata', async (metadata) => {
  const [instance, created] = await Resource.findOrCreate({
    where: {
      infohash: metadata.infohash
    },

    defaults: {
      magnet: metadata.magnet,
      name: metadata.info.name.toString('utf8'),
      score: 0
    }
  })

  if (!created) {
    await instance.update({
      score: instance.get('score') + 1
    })
  }
})

p2p.listen()
