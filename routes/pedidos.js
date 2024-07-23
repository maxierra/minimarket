// routes/pedidosRoutes.js
const express = require('express');
const router = express.Router();
const db = require("../db/creardb")(); // Importar la base de datos inicializada

// 1. Agregar un pedido
router.post('/add-order', (req, res) => {
    let { provider_name, contact_person, order_date, delivery_date, order_status, payment_status, ordered_quantity, order_description, invoice_number } = req.body;
    let sql = `INSERT INTO orders (provider_name, contact_person, order_date, delivery_date, order_status, payment_status, ordered_quantity, order_description, invoice_number) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [provider_name, contact_person, order_date, delivery_date, order_status, payment_status, ordered_quantity, order_description, invoice_number], function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Pedido agregado con ID: ${this.lastID}`);
        res.send('Pedido agregado correctamente');
    });
});

// 2. Obtener todos los pedidos
router.get('/get-orders', (req, res) => {
    let sql = `SELECT * FROM orders`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.json({ orders: rows });
    });
});

// 3. Obtener un pedido por ID
router.get('/get-order/:id', (req, res) => {
    let orderId = req.params.id;
    let sql = `SELECT * FROM orders WHERE order_id = ?`;
    db.get(sql, [orderId], (err, row) => {
        if (err) {
            throw err;
        }
        res.json(row);
    });
});

// 4. Actualizar un pedido por ID
router.put('/update-order/:id', (req, res) => {
    let orderId = req.params.id;
    let { provider_name, contact_person, order_date, delivery_date, order_status, payment_status, ordered_quantity, order_description, invoice_number } = req.body;
    let sql = `UPDATE orders 
               SET provider_name = ?, contact_person = ?, order_date = ?, delivery_date = ?, order_status = ?, payment_status = ?, ordered_quantity = ?, order_description = ?, invoice_number = ?
               WHERE order_id = ?`;
    db.run(sql, [provider_name, contact_person, order_date, delivery_date, order_status, payment_status, ordered_quantity, order_description, invoice_number, orderId], function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Pedido actualizado con ID: ${orderId}`);
        res.send('Pedido actualizado correctamente');
    });
});

// 5. Eliminar un pedido por ID
router.delete('/delete-order/:id', (req, res) => {
    let orderId = req.params.id;
    let sql = `DELETE FROM orders WHERE order_id = ?`;
    db.run(sql, [orderId], function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Pedido eliminado con ID: ${orderId}`);
        res.send('Pedido eliminado correctamente');
    });
});

module.exports = router;
