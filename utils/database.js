const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("node-shop-app", "root", "Suman@007", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;
