import Sequelize from 'sequelize'
import sequelize from './db'

const Resource = sequelize.define('resource', {
  infohash: {
    type: Sequelize.STRING,
    primaryKey: true
  },

  name: {
    type: Sequelize.STRING,
    allowNull: false
  },

  magnet: {
    type: Sequelize.TEXT,
    allowNull: false
  },

  score: {
    type: Sequelize.BIGINT,
    defaultValue: 0
  }
},  {
  freezeTableName: true
})

Resource.sync().then(function () {
  console.log('Resource db sync')
})

export default Resource
