const PdfPrinter = require("pdfmake");
const { parseStringPromise } = require("xml2js");
const path = require("path");

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "fonts/Roboto-Bold.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

// Configuración por proyecto
const proyectosConfig = {
  b32: {
    logo: path.join(__dirname, "assets/b32_logo.png"),
    colorPrincipal: "#007BFF",
    titulo: "REPORTE DE ESTADOS",
  },
  b43: {
    logo: path.join(__dirname, "assets/b43_logo.png"),
    colorPrincipal: "#28A745",
    titulo: "REPORTE PLATOS VENDIDOS",
  },
  default: {
    logo: path.join(__dirname, "assets/logo_default.png"),
    colorPrincipal: "#6C757D",
    titulo: "REPORTE GENERAL",
  },
};

const generarPDFdesdeXMLyDatos = async (xml, datos, proyecto = "default") => {
  const config = proyectosConfig[proyecto] || proyectosConfig.default;

  const resultado = await parseStringPromise(xml);
  const cabecera = resultado.cabecera;

  const data = {
    establecimiento: cabecera.establecimiento?.[0] || "",
    nit: cabecera.nit?.[0] || "",
    direccion: cabecera.direccion?.[0] || "",
    telefono: cabecera.telefono?.[0] || "",
    fecha: cabecera.fecha?.[0] || "",
  };

  const content = [];

  // Encabezado con logo y título dinámico
  content.push({
    columns: [
      { image: config.logo, width: 70, margin: [0, 0, 15, 0] },
      {
        text: config.titulo,
        style: "titulo",
        alignment: "center",
        margin: [0, 20, 0, 0],
        color: config.colorPrincipal,
      },
    ],
  });

  // Línea divisoria
  content.push({
    canvas: [
      {
        type: "line",
        x1: 0,
        y1: 0,
        x2: 750,
        y2: 0,
        lineWidth: 1.5,
        lineColor: config.colorPrincipal,
      },
    ],
    margin: [0, 15, 0, 20],
  });

  // Cabecera
  content.push({
    columns: [
      {
        width: "50%",
        stack: [
          {
            text: `🏢 Establecimiento: ${data.establecimiento}`,
            style: "cabecera",
          },
          { text: `🔢 NIT: ${data.nit}`, style: "cabecera" },
          { text: `📞 Teléfono: ${data.telefono}`, style: "cabecera" },
        ],
      },
      {
        width: "50%",
        stack: [
          { text: `📍 Dirección: ${data.direccion}`, style: "cabecera" },
          { text: `📅 Fecha: ${data.fecha}`, style: "cabecera" },
        ],
      },
    ],
    columnGap: 25,
    margin: [0, 0, 0, 25],
  });

  // Tabla
  let orientation = "portrait";
  let fontSizeTabla = 9;

  if (datos.length > 0) {
    const columnas = Object.keys(datos[0]);
    const numCols = columnas.length;

    // 📌 Lógica que pediste:
    let widths, paddings;
    if (numCols <= 2) {
      widths = columnas.map(() => "*");
      fontSizeTabla = 9;
      orientation = "portrait";
      paddings = { left: 8, right: 8, top: 4, bottom: 4 };
    } else {
      widths = columnas.map(() => "auto");
      fontSizeTabla = 7;
      orientation = "landscape";
      paddings = { left: 4, right: 4, top: 2, bottom: 2 };
    }

    const tabla = {
      table: {
        headerRows: 1,
        widths,
        body: [
          // Encabezados
          columnas.map((col) => ({
            text: col.toUpperCase(),
            bold: true,
            fillColor: config.colorPrincipal,
            color: "white",
            alignment: "center",
            margin: [0, 5, 0, 5],
          })),
          // Filas
          ...datos.map((row, i) =>
            columnas.map((col) => ({
              text: String(row[col] || ""),
              style: "tablaDatos",
              alignment: typeof row[col] === "number" ? "right" : "left",
              fillColor: i % 2 === 0 ? "#F7F9FC" : null,
            }))
          ),
        ],
      },
      layout: {
        hLineWidth: (i, node) =>
          i === 0 || i === node.table.body.length ? 1.2 : 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#cccccc",
        vLineColor: () => "#cccccc",
        paddingLeft: () => paddings.left,
        paddingRight: () => paddings.right,
        paddingTop: () => paddings.top,
        paddingBottom: () => paddings.bottom,
      },
    };

    content.push(tabla);
  } else {
    content.push({
      text: "⚠️ No hay resultados para mostrar.",
      italics: true,
      color: "#888888",
    });
  }

  // Definición del documento
  const docDefinition = {
    content,
    styles: {
      titulo: { fontSize: 20, bold: true, letterSpacing: 1 },
      cabecera: { fontSize: 11, margin: [0, 2, 0, 2] },
      tablaDatos: { fontSize: fontSizeTabla, lineHeight: 1.1 },
    },
    defaultStyle: { font: "Roboto" },
    pageMargins: [40, 60, 40, 60],
    pageOrientation: orientation,
    footer: function (currentPage, pageCount) {
      return {
        columns: [
          {
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: "right",
            margin: [0, 0, 40, 0],
            fontSize: 9,
            color: "#666666",
          },
        ],
      };
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const chunks = [];

  return new Promise((resolve, reject) => {
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
    pdfDoc.end();
  });
};

module.exports = { generarPDFdesdeXMLyDatos };
