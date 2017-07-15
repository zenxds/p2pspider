module.exports = {
  "btConfig": {
    "timeout": 10000,
    "maxConnections": 40
  },
  "dhtConfig": {
    "address": "0.0.0.0",
    "port": 6881,
    "bootstrapNodes": [
      ["router.bittorrent.com", 6881],
      ["dht.transmissionbt.com", 6881]
    ],
    "maxNodesSize": 32
  },
  "db": {
    "dialect": "mysql",
    "host": "localhost",
    "port": "3306",
    "database": "",
    "username": "",
    "password": ""
  }
}
