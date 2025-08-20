function construirCabecera(docData) {
  return {
    style: "cabecera",
    table: {
      widths: ["*"],
      body: [
        [`Establecimiento: ${docData.establecimiento}`],
        [`NIT: ${docData.nit}`],
        [`Direccion: ${docData.direccion}`],
        [`Telefono: ${docData.telefono}`],
        [`Fecha: ${docData.fecha}`],
      ],
    },
    layout: "noBorders",
    margin: [0, 0, 0, 10],
  };
}

module.exports = {
  construirCabecera,
};
