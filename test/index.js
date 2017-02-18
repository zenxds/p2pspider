'use strict'
import P2PSpider from '../lib'

const p2p = new P2PSpider()

p2p.filter((infohash, rinfo) => {
    // false => always to download the metadata even though the metadata is exists.
  const theInfohashIsExistsInDatabase = false
  return theInfohashIsExistsInDatabase
})

p2p.on('metadata', (metadata) => {
  console.log(metadata)
})

p2p.listen()
