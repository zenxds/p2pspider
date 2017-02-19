import Sequelize from 'sequelize'
import config from 'config'

const dbConfig = config.get('db')
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: false
})

sequelize
.authenticate()
.then(function() {
  
})
.catch(function (err) {
  console.log('Unable to connect to DB:', err)
})

export default sequelize
