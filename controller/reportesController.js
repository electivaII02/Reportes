const {
  obtenerReportesPorCodigoProyecto,
  ejecutarReporte,
} = require("../services/reporteService");

const db = require("../models/db");
const { obtenerReportesPorPlataforma } = require("../models/reporteModel");
const { obtenerParametrosPorReporte } = require("../models/parametroModel");
const { crearConexionDinamica } = require("../utils/conexionDinamica");
const { generarPDFdesdeXMLyDatos } = require("../utils/generarPDF");
const { buscarProyectoPorCodigo } = require("../models/proyectoModel");
const generarCabeceraConReportePDF = async (req, res) => {
  try {
    const { id_proyecto, id_reporte } = req.params;
    const parametros = req.query; // parámetros del reporte (inicio, fin, etc.)

    // 1. Obtener proyecto y su cabecera
    const proyecto = await buscarProyectoPorCodigo(id_proyecto);
    if (!proyecto)
      return res.status(404).json({ error: "Proyecto no encontrado" });

    const xml = proyecto.cabecera;

    // 2. Validar y ejecutar reporte como ya haces en tu servicio
    const reportes = await obtenerReportesPorPlataforma(proyecto.id_plataforma);
    const reporte = reportes.find((r) => r.id_reporte == id_reporte);
    if (!reporte)
      return res
        .status(404)
        .json({ error: "Reporte no válido para el proyecto" });

    const parametrosRequeridos = await obtenerParametrosPorReporte(id_reporte);
    const nombresParametrosRequeridos = parametrosRequeridos.map(
      (p) => p.nombre
    );
    const faltantes = nombresParametrosRequeridos.filter(
      (p) => !(p in parametros)
    );

    if (faltantes.length > 0) {
      return res
        .status(400)
        .json({ error: `Faltan parámetros: ${faltantes.join(", ")}` });
    }

    // 3. Obtener SQL y ejecutarla en fuente externa
    const [repo] = await db.execute(
      `SELECT sentencia_sql FROM repositorios_sql r
       JOIN reportes rep ON r.id_repositorio = rep.id_repositorio
       WHERE rep.id_reporte = ? LIMIT 1`,
      [id_reporte]
    );

    let sql = repo[0].sentencia_sql;
    for (const nombre in parametros) {
      const valor = parametros[nombre];
      const placeholder = new RegExp(`:${nombre}\\b`, "g");
      sql = sql.replace(placeholder, db.escape(valor));
    }

    const fuente = await buscarProyectoPorCodigo(id_proyecto);
    const conexion = await crearConexionDinamica(fuente);
    const [datosReporte] = await conexion.query(sql);
    await conexion.end();

    // 4. Generar PDF combinando XML + datos
    const pdfBuffer = await generarPDFdesdeXMLyDatos(xml, datosReporte);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=reporte.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando PDF" });
  }
};

const getReportesPorProyecto = async (req, res) => {
  const { codigo_proyecto } = req.params;

  try {
    const reportes = await obtenerReportesPorCodigoProyecto(codigo_proyecto);
    res.status(200).json(reportes);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const ejecutarReportes = async (req, res) => {
  try {
    await ejecutarReporte(req, res);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const generarCabeceraPDF = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const [rows] = await db.execute(
      "SELECT cabecera FROM proyectos WHERE id_proyecto = ?",
      [id_proyecto]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    const xml = rows[0].cabecera;
    const pdfBuffer = await generarPDFdesdeXMLyDatos(xml);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=cabecera.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando PDF" });
  }
};

module.exports = {
  getReportesPorProyecto,
  ejecutarReportes,
  generarCabeceraPDF,
  generarCabeceraConReportePDF,
};
