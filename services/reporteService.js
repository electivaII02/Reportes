const {
  buscarProyectoPorCodigo,
  buscarFuenteSQLPorCodigo,
} = require("../models/proyectoModel");
const { obtenerReportesPorPlataforma } = require("../models/reporteModel");
const { obtenerParametrosPorReporte } = require("../models/parametroModel");
const db = require("../models/db");
const { crearConexionDinamica } = require("../utils/conexionDinamica");

const obtenerReportesPorCodigoProyecto = async (codigo_proyecto) => {
  const proyecto = await buscarProyectoPorCodigo(codigo_proyecto);

  if (!proyecto) {
    throw new Error("Proyecto no encontrado con ese código.");
  }

  const reportesRaw = await obtenerReportesPorPlataforma(
    proyecto.id_plataforma
  );
  const reportes = [];

  for (const r of reportesRaw) {
    const parametros = await obtenerParametrosPorReporte(r.id_reporte);
    reportes.push({
      id_reporte: r.id_reporte,
      nombre: r.nombre,
      categoria: r.categoria,
      detalle: r.detalle,
      parametros,
    });
  }

  return reportes;
};

const ejecutarReporte = async (req, res) => {
  const { codigo_proyecto, id_reporte } = req.params;
  const parametrosEnviados = req.query;

  // 1. Buscar proyecto
  const proyecto = await buscarProyectoPorCodigo(codigo_proyecto);
  if (!proyecto) {
    return res.status(404).json({ error: "Proyecto no encontrado" });
  }

  // 2. Validar que el reporte esté asociado a ese proyecto
  const reportes = await obtenerReportesPorPlataforma(proyecto.id_plataforma);
  const reporte = reportes.find((r) => r.id_reporte == id_reporte);
  if (!reporte) {
    return res
      .status(404)
      .json({ error: "Reporte no encontrado en esta plataforma" });
  }

  // 3. Obtener parámetros requeridos
  const parametrosRequeridos = await obtenerParametrosPorReporte(id_reporte);
  const nombresParametrosRequeridos = parametrosRequeridos.map((p) => p.nombre);

  // 4. Validar parámetros faltantes
  const faltantes = nombresParametrosRequeridos.filter(
    (p) => !(p in parametrosEnviados)
  );
  if (faltantes.length > 0) {
    return res
      .status(400)
      .json({ error: `Parámetros faltantes: ${faltantes.join(", ")}` });
  }

  try {
    // 5. Obtener SQL
    const [repo] = await db.execute(
      `
      SELECT sentencia_sql
      FROM repositorios_sql r
      JOIN reportes rep ON r.id_repositorio = rep.id_repositorio
      WHERE rep.id_reporte = ?
      LIMIT 1
    `,
      [id_reporte]
    );

    if (!repo.length || !repo[0].sentencia_sql) {
      return res
        .status(400)
        .json({ error: "No se encontró la sentencia SQL del reporte" });
    }

    let sentenciaSQL = repo[0].sentencia_sql;

    // 6. Reemplazar parámetros en la SQL
    for (const nombre in parametrosEnviados) {
      const valor = parametrosEnviados[nombre];
      const placeholder = new RegExp(`:${nombre}\\b`, "g");
      sentenciaSQL = sentenciaSQL.replace(placeholder, db.escape(valor));
    }

    // 7. Obtener fuente y ejecutar en BD externa
    const fuente = await buscarFuenteSQLPorCodigo(codigo_proyecto);
    if (!fuente) {
      return res
        .status(500)
        .json({ error: "Fuente de datos SQL no encontrada" });
    }

    const conexion = await crearConexionDinamica(fuente);

    // ✅ CORRECTA DESESTRUCTURACIÓN
    const [rows] = await conexion.query(sentenciaSQL);
    await conexion.end();
    console.log("Reporte-->", sentenciaSQL);
    return res.json(rows);
  } catch (error) {
    console.error("Error ejecutando reporte:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = { obtenerReportesPorCodigoProyecto, ejecutarReporte };
