const express = require("express");
const router = express.Router();
const db = require("../db/creardb")(); // Importar la base de datos inicializada

// Ruta para servir la página de login
router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log("Received username:", username);
  console.log("Received password:", password);

  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) {
        console.error("Error al ejecutar la consulta:", err);
        res.status(500).json({ error: err.message });
      } else {
        console.log("Consulta ejecutada correctamente");
        console.log("Resultado de la consulta:", row); // Agrega esta línea para verificar el resultado de la consulta

        if (row) {
          console.log("Usuario encontrado:", row);
          res.json({ success: true });
        } else {
          console.log("Usuario no encontrado para:", username);
          res.json({ success: false });
        }
      }
    }
  );
});

module.exports = router;
