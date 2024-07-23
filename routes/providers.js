const express = require('express');
const router = express.Router();
const db = require("../db/creardb")(); // Importar la base de datos inicializada


// Ruta para obtener todos los proveedores
router.get('/get-providers', (req, res) => {
  db.all('SELECT * FROM providers', (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json({ providers: rows });
  });
});

// Ruta para agregar un proveedor
router.post('/add-provider', (req, res) => {
  const { company_name, cuit, phone, email, contact_name } = req.body;
  db.run(
    `INSERT INTO providers (company_name, cuit, phone, email, contact_name) VALUES (?, ?, ?, ?, ?)`,
    [company_name, cuit, phone, email, contact_name],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json({
        message: 'Proveedor agregado exitosamente',
        provider_id: this.lastID,
      });
    }
  );
});

// Ruta para obtener un proveedor específico
router.get('/get-provider/:id', (req, res) => {
  const providerId = req.params.id;
  db.get(
    'SELECT * FROM providers WHERE provider_id = ?',
    [providerId],
    (err, row) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json(row);
    }
  );
});

// Ruta para editar un proveedor
router.put('/edit-provider/:id', (req, res) => {
  const providerId = req.params.id;
  const { company_name, cuit, phone, email, contact_name } = req.body;
  db.run(
    `UPDATE providers SET company_name = ?, cuit = ?, phone = ?, email = ?, contact_name = ? WHERE provider_id = ?`,
    [company_name, cuit, phone, email, contact_name, providerId],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json({ message: 'Proveedor actualizado exitosamente' });
    }
  );
});

// Ruta para eliminar un proveedor
router.delete('/delete-provider/:id', (req, res) => {
  const providerId = req.params.id;
  db.run(
    'DELETE FROM providers WHERE provider_id = ?',
    [providerId],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json({ message: 'Proveedor eliminado exitosamente' });
    }
  );
});

module.exports = router;
