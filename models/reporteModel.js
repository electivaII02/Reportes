const pool = require("../models/db");

const obtenerReportesPorPlataforma = async (id_plataforma) => {
  const [rows] = await pool.execute(
    `SELECT r.id_reporte, r.nombre, r.categoria, r.detalle
     FROM reportes_plataforma rp
     JOIN reportes r ON rp.id_reporte = r.id_reporte
     WHERE rp.id_plataforma = ?`,
    [id_plataforma]
  );
  return rows;
};

module.exports = { obtenerReportesPorPlataforma };
