import Sequelize from 'sequelize'
import sequelize from './db'

const getResourceModel = (table) => {
  return sequelize.define('table', {
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
}

export const Resource = getResourceModel('resource')
export const ResourceEn = getResourceModel('resource_en')

Resource.sync()
ResourceEn.sync()

