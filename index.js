const express = require("express");
const cors = require("cors");
const reportesRoutes = require("./routes/reportesRoutes");
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/configDocs");

app.use(cors());
app.use(express.json());
app.use(reportesRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Swagger disponible en http://localhost:${PORT}/api-docs`);
});
