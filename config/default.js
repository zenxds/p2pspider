module.exports = {
  "btConfig": {
    "timeout": 10000,
    "maxConnections": 10
  },
  "dhtConfig": {
    "address": "0.0.0.0",
    "port": 6881,
    "replyFindNode": true,
    "bootstrapNodes": [
      ["router.bittorrent.com", 6881],
      ["dht.transmissionbt.com", 6881],
      ["router.utorrent.com", 6881]
    ],
    "maxNodesSize": 8
  },
  "db": {
    "dialect": "mysql",
    "host": "localhost",
    "port": "3306",
    "database": "",
    "username": "",
    "password": ""
  },
  "redis": {
    host: '127.0.0.1',
    port: 6379,
    db: 1
    // password: null
  }
}
