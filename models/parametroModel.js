const pool = require("../models/db");

const obtenerParametrosPorReporte = async (id_reporte) => {
  const [rows] = await pool.execute(
    `SELECT nombre, etiqueta, tipo_dato
     FROM parametros_reportes
     WHERE id_reporte = ?`,
    [id_reporte]
  );
  return rows;
};

module.exports = { obtenerParametrosPorReporte };
