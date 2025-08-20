const swaggerJSDoc = require("swagger-jsdoc");
const path = require("path");
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "REPORTES API",
    version: "1.0.0",
    description: "API para la generacion de reportes",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor local",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, "../routes/*.js")],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
