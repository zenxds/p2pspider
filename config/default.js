module.exports = {
  "btConfig": {
    "timeout": 10000,
    "maxConnections": 20
  },
  "dhtConfig": {
    "address": "0.0.0.0",
    "port": 6881,
    "bootstrapNodes": [
      ["router.bittorrent.com", 6881],
      ["dht.transmissionbt.com", 6881]
    ],
    "nodesMaxSize": 20
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
