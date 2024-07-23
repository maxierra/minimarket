const express = require('express');
const router = express.Router();
const db = require("../db/creardb")(); // Importar la base de datos inicializada

// Ruta para insertar un registro de caja diaria
router.post("/insert-daily-cash", (req, res) => {
  const { fecha_hora, motivo_egreso, motivo_ingreso, descripcion, monto } = req.body;
  const query = `INSERT INTO daily_cash_control (fecha_hora, motivo_egreso, motivo_ingreso, descripcion, monto) VALUES (?, ?, ?, ?, ?)`;
  db.run(
    query,
    [fecha_hora, motivo_egreso, motivo_ingreso, descripcion, monto],
    function (err) {
      if (err) {
        console.error("Error al insertar el registro de caja diaria:", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Ruta para obtener los registros de caja diaria
router.get("/get-daily-cash-records", (req, res) => {
  const query = `SELECT * FROM daily_cash_control ORDER BY fecha_hora DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener los registros de caja diaria:", err.message);
      res.json({ success: false });
    } else {
      res.json({ success: true, records: rows });
    }
  });
});

module.exports = router;
