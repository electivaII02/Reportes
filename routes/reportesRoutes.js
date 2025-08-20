const express = require("express");
const router = express.Router();
const {
  getReportesPorProyecto,
  generarCabeceraConReportePDF,
} = require("../controller/reportesController");
const {
  ejecutarReportes,
  generarCabeceraPDF,
} = require("../controller/reportesController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Parametros:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: inicio
 *         etiqueta:
 *           type: string
 *           example: fecha-inicio
 *         tipo_dato:
 *           type: string
 *           example: date
 *     Reporte:
 *       type: object
 *       properties:
 *         id_reporte:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: Mostrar platos más vendidos en el restaurante
 *         categoria:
 *           type: string
 *           example: Restaurante
 *         detalle:
 *           type: string
 *           example: Este es el reporte se mostrara la cantidad de pedidos más vendidos en el restaurante entre un rango de fechas
 *         parametros:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Parametro'
 */

/**
 * @swagger
 * /proyecto/{codigo_proyecto}:
 *   get:
 *     summary: Obtener los reportes de un proyecto por su código
 *     tags:
 *       - Reportes
 *     parameters:
 *       - in: path
 *         name: codigo_proyecto
 *         required: true
 *         schema:
 *           type: string
 *         description: Código del proyecto (por ejemplo, "b43")
 *     responses:
 *       200:
 *         description: Lista de reportes del proyecto
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reporte'
 *       404:
 *         description: Proyecto no encontrado
 */

router.get("/proyecto/:codigo_proyecto", getReportesPorProyecto);

/**
 * @swagger
 * /proyecto/{codigo_proyecto}/reporte/{id_reporte}/ejecutar:
 *   get:
 *     summary: Ejecutar un reporte específico de un proyecto
 *     tags:
 *       - Reportes
 *     parameters:
 *       - in: path
 *         name: codigo_proyecto
 *         required: true
 *         schema:
 *           type: string
 *         description: Código del proyecto (por ejemplo, "b43")
 *       - in: path
 *         name: id_reporte
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del reporte a ejecutar
 *       - in: query
 *         name: inicio
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (solo si el reporte lo requiere)
 *       - in: query
 *         name: fin
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (solo si el reporte lo requiere)
 *     responses:
 *       200:
 *         description: Resultado del reporte ejecutado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 datos:
 *                   - nombre_plato: "Bandeja paisa"
 *                     cantidad_vendida: 58
 *                   - nombre_plato: "Ajiaco"
 *                     cantidad_vendida: 42
 *                 total_resultados: 2
 *       400:
 *         description: Parámetros inválidos o faltantes
 *       404:
 *         description: Reporte no encontrado
 */
router.get(
  "/proyecto/:codigo_proyecto/reporte/:id_reporte/ejecutar",
  ejecutarReportes
);

router.get("/api/pdf/cabecera/:id_proyecto", generarCabeceraPDF);

router.get(
  "/api/pdf/cabecera/:id_proyecto/:id_reporte",
  generarCabeceraConReportePDF
);

module.exports = router;
