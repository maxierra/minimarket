const express = require('express');
const router = express.Router();
const db = require("../db/creardb")(); // Importar la base de datos inicializada

// Ruta para crear un nuevo comercio
router.post('/create-commerce', (req, res) => {
  const {
    name,
    address,
    cuit,
    tax_situation,
    start_of_activities,
    ticket_start_number,
  } = req.body;
  const sql = `INSERT INTO commerce (name, address, cuit, tax_situation, start_of_activities, ticket_start_number) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [
    name,
    address,
    cuit,
    tax_situation,
    start_of_activities,
    ticket_start_number,
  ];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      success: true,
      commerce_id: this.lastID,
    });
  });
});

// Ruta para actualizar un comercio
router.put('/update-commerce/:id', (req, res) => {
  const {
    name,
    address,
    cuit,
    tax_situation,
    start_of_activities,
    ticket_start_number,
  } = req.body;
  const sql = `UPDATE commerce SET name = ?, address = ?, cuit = ?, tax_situation = ?, start_of_activities = ?, ticket_start_number = ? WHERE commerce_id = ?`;
  const params = [
    name,
    address,
    cuit,
    tax_situation,
    start_of_activities,
    ticket_start_number,
    req.params.id,
  ];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      success: true,
      changes: this.changes,
    });
  });
});

// Ruta para actualizar solo el número de ticket de un comercio
router.put('/update-ticket-number/:id', (req, res) => {
  const { ticket_start_number } = req.body;
  const sql = `UPDATE commerce SET ticket_start_number = ? WHERE commerce_id = ?`;
  const params = [ticket_start_number, req.params.id];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      success: true,
      changes: this.changes,
    });
  });
});


// Ruta para eliminar un comercio
router.delete('/delete-commerce/:id', (req, res) => {
  const sql = `DELETE FROM commerce WHERE commerce_id = ?`;
  const params = [req.params.id];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      success: true,
      changes: this.changes,
    });
  });
});

// Ruta para obtener todos los datos del comercio
router.get('/get-commerce-data', (req, res) => {
  const sql = 'SELECT * FROM commerce';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Ruta para obtener los datos del comercio por ID
router.get('/get-commerce-data/:id', (req, res) => {
  const sql = 'SELECT * FROM commerce WHERE commerce_id = ?';
  const params = [req.params.id];
  db.get(sql, params, (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

module.exports = router;
