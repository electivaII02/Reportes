const PdfPrinter = require("pdfmake");
const { parseStringPromise } = require("xml2js");
const { construirCabecera } = require("./plantillaCabeceraXML");
const fs = require("fs");
const path = require("path");

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "fonts/Roboto-Bold.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

const generarPDFdesdeXMLyDatos = async (xml, datos) => {
  const resultado = await parseStringPromise(xml);
  const cabecera = resultado.cabecera;

  const data = {
    establecimiento: cabecera.establecimiento?.[0] || "",
    nit: cabecera.nit?.[0] || "",
    direccion: cabecera.direccion?.[0] || "",
    telefono: cabecera.telefono?.[0] || "",
    fecha: cabecera.fecha?.[0] || "",
  };

  // Contenido del PDF
  const content = [];

  // Título principal
  content.push({
    text: "REPORTE GENERAL",
    style: "titulo",
    margin: [0, 0, 0, 10],
  });

  // Cabecera en dos columnas
  content.push({
    columns: [
      {
        width: "50%",
        text: [
          { text: "Establecimiento: ", bold: true },
          data.establecimiento + "\n",
          { text: "NIT: ", bold: true },
          data.nit + "\n",
          { text: "Teléfono: ", bold: true },
          data.telefono + "\n",
        ],
        style: "cabecera",
      },
      {
        width: "50%",
        text: [
          { text: "Dirección: ", bold: true },
          data.direccion + "\n",
          { text: "Fecha: ", bold: true },
          data.fecha + "\n",
        ],
        style: "cabecera",
      },
    ],
    columnGap: 20,
    margin: [0, 0, 0, 20],
  });

  // Tabla de datos
  if (datos.length > 0) {
    const columnas = Object.keys(datos[0]);
    const tabla = {
      table: {
        headerRows: 1,
        widths: Array(columnas.length).fill("*"),
        body: [
          columnas.map((col) => ({
            text: col.toUpperCase(),
            bold: true,
            fillColor: "#eeeeee",
          })),
          ...datos.map((row) => columnas.map((col) => String(row[col] || ""))),
        ],
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex % 2 === 0 ? null : "#f9f9f9"),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#cccccc",
        vLineColor: () => "#cccccc",
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 4,
        paddingBottom: () => 4,
      },
    };

    content.push(tabla);
  } else {
    content.push({ text: "No hay resultados para mostrar.", italics: true });
  }

  // Definición del documento
  const docDefinition = {
    content,
    styles: {
      titulo: {
        fontSize: 16,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 10],
      },
      cabecera: {
        fontSize: 10,
        alignment: "left",
      },
    },
    defaultStyle: {
      font: "Roboto",
    },
    pageMargins: [40, 60, 40, 60],
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
