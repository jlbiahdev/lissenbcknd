const { Sequelize } = require("sequelize");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const env = process.env.NODE_ENV === 'production' ? '' : '_DEV';
const sequelize = new Sequelize(
  process.env[`DB_NAME${env}`],
  process.env[`DB_USER${env}`],
  process.env[`DB_PASS${env}`],

  {
    port: process.env[`DB_PORT${env}`],
    host: process.env[`DB_HOST${env}`],
    dialect: 'postgres',
    logging: false,
  }
);

module.exports = sequelize;
