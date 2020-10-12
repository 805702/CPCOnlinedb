const Sequelize = require('sequelize')

module.exports.sequelize = new Sequelize(process.env.DBNAME, process.env.DBUSER, process.env.DBPWD, {
    dialect:'mysql'
})