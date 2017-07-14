import Sequelize from 'sequelize'
import sequelize from './db'

const Resource = sequelize.define('resource', {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },

  infohash: {
    type: Sequelize.STRING,
    unique: true
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
  freezeTableName: true,
  indexes: [{
    unique: true,
    fields: ['infohash']
  }]
})

Resource.sync().then(() => {

})

export default Resource
