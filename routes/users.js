const express = require('express');
const router = express.Router();
const db = require("../db/creardb")(); // Importar la base de datos inicializada

// Ruta para obtener todos los usuarios
router.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Ruta para crear un nuevo usuario
router.post('/api/users', (req, res) => {
  const { username, password, role } = req.body;
  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, password, role],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID, username, role });
    }
  );
});

// Ruta para eliminar un usuario
router.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;

  // Busca el usuario en la base de datos
  db.get(`SELECT * FROM users WHERE id = ?`, id, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Verifica si el usuario es el usuario admin
    if (row && row.username === 'admin' && row.password === 'admin2024') {
      res.status(403).json({ error: 'No se puede eliminar el usuario admin' });
      return;
    }

    // Elimina el usuario de la base de datos
    db.run(`DELETE FROM users WHERE id = ?`, id, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(204).end();
    });
  });
});

// Ruta para actualizar un usuario
router.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  // Busca el usuario en la base de datos
  db.get(`SELECT * FROM users WHERE id = ?`, id, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Verifica si el usuario es el usuario admin
    if (row && row.username === 'admin' && row.password === 'admin2024') {
      res.status(403).json({ error: 'No se puede editar el usuario admin' });
      return;
    }

    // Actualiza el usuario en la base de datos
    db.run(
      `UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?`,
      [username, password, role, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(200).json({ id, username, role });
      }
    );
  });
});

module.exports = router;
