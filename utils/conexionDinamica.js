const mysql = require("mysql2/promise");

const crearConexionDinamica = async (config) => {
  return await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.db_name,
    multipleStatements: false,
  });
};

module.exports = { crearConexionDinamica };
