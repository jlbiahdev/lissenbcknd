const { Sequelize } = require("sequelize");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const env = process.env.NODE_ENV === 'production' ? '' : '_DEV';
console.log(`Connecting to NODE_ENV: ${process.env['NODE_ENV']}`);
console.log(`Connecting to database: ${process.env[`DB_PASS${env}`]}`);
const sequelize = new Sequelize(
  process.env[`DB_NAME${env}`],
  process.env[`DB_USER${env}`],
  process.env[`DB_PASS${env}`],
  {
    host: process.env[`DB_HOST${env}`],
    dialect: 'postgres',
    logging: false,
  }
);

module.exports = sequelize;
