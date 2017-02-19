'use strict'
import P2PSpider from '../lib'
import Resource from './model'

const p2p = new P2PSpider()

p2p.filter((infohash, rinfo) => {
    // false => always to download the metadata even though the metadata is exists.
  const theInfohashIsExistsInDatabase = false
  return theInfohashIsExistsInDatabase
})

p2p.on('metadata', (metadata) => {
  console.log(metadata.info.name.toString('utf8'))
})

p2p.listen()
