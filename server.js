const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;
const { startAddingProducts, stopAddingProducts } = require('./fictitiousProducts');

// Configurar middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('views'));

// Configurar Express para renderizar vistas EJS desde la carpeta 'views'
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurar la base de datos SQLite3
const db = new sqlite3.Database('./products.db');

// Crear las tablas si no existen
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        purchase_price REAL NOT NULL,
        percentage_increase REAL NOT NULL,
        sale_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        category TEXT NOT NULL,
        expiration_date TEXT NOT NULL
    )`);

    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS daily_cash_control (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_hora TEXT NOT NULL,
            motivo_egreso TEXT,
            motivo_ingreso TEXT,
            descripcion TEXT,
            monto REAL NOT NULL
        )`);
    });
    
    

    db.run(`CREATE TABLE IF NOT EXISTS sales (
        sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        net_profit REAL,
        payment_methods TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        net_profit REAL DEFAULT 0,
        FOREIGN KEY (sale_id) REFERENCES sales(sale_id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`);
});

// Ruta principal para cargar la página principal
app.get('/', (req, res) => {
    res.render('main.ejs');
});

// Ruta para la página de caja diaria
app.get('/caja_diaria', (req, res) => {
    res.render('caja_diaria');
});

// Ruta para la página de reportes de ventas
app.get('/reportesventas', (req, res) => {
    res.render('reportesventas');
});

// Rutas para inventario y ventas
app.get('/inventario', (req, res) => {
    res.render('inventario.ejs');
});

app.get('/ventas', (req, res) => {
    res.render('ventas.ejs');
});

app.post('/insert-daily-cash', (req, res) => {
    const { fecha_hora, motivo_egreso, motivo_ingreso, descripcion, monto } = req.body;
    const query = `INSERT INTO daily_cash_control (fecha_hora, motivo_egreso, motivo_ingreso, descripcion, monto) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [fecha_hora, motivo_egreso, motivo_ingreso, descripcion, monto], function(err) {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, id: this.lastID });
    });
});

// Ejemplo de cómo podrías implementar un endpoint GET para obtener registros de caja diaria

app.get('/get-daily-cash-records', (req, res) => {
    const query = 'SELECT * FROM daily_cash_control ORDER BY id DESC';
    db.all(query, (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, records: rows });
    });
});

app.get('/sales-reports', (req, res) => {
    const { startDate, endDate } = req.query;

    let query = `
        SELECT 
            DATE(sale_date) as date, 
            SUM(total_amount) as totalDailySales, 
            SUM(net_profit) as netDailyProfit,
            SUM(CASE WHEN payment_methods = 'Efectivo' THEN total_amount ELSE 0 END) * 100.0 / SUM(total_amount) as efectivoPercentage,
            SUM(CASE WHEN payment_methods = 'Tarjeta de Crédito' THEN total_amount ELSE 0 END) * 100.0 / SUM(total_amount) as creditoPercentage,
            SUM(CASE WHEN payment_methods = 'Tarjeta de Débito' THEN total_amount ELSE 0 END) * 100.0 / SUM(total_amount) as debitoPercentage,
            SUM(CASE WHEN payment_methods = 'MercadoPago' THEN total_amount ELSE 0 END) * 100.0 / SUM(total_amount) as mercadopagoPercentage
        FROM sales 
        WHERE 1=1
    `;
    const params = [];

    if (startDate) {
        query += ' AND DATE(sale_date) >= ?';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND DATE(sale_date) <= ?';
        params.push(endDate);
    }

    query += ' GROUP BY DATE(sale_date) ORDER BY DATE(sale_date) ASC';

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, records: rows });
    });
});



// Rutas CRUD para productos
app.post('/products', (req, res) => {
    const { name, brand, purchase_price, percentage_increase, sale_price, quantity, category, expiration_date } = req.body;
    db.run(`INSERT INTO products (name, brand, purchase_price, percentage_increase, sale_price, quantity, category, expiration_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, brand, purchase_price, percentage_increase, sale_price, quantity, category, expiration_date],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
});

app.get('/products', (req, res) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ products: rows });
    });
});

app.get('/products/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT id, name, brand, sale_price FROM products WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

app.put('/products/:id', (req, res) => {
    const { name, brand, purchase_price, percentage_increase, sale_price, quantity, category, expiration_date } = req.body;
    const { id } = req.params;
    db.run(`UPDATE products SET name = ?, brand = ?, purchase_price = ?, percentage_increase = ?, sale_price = ?, quantity = ?, category = ?, expiration_date = ? WHERE id = ?`,
        [name, brand, purchase_price, percentage_increase, sale_price, quantity, category, expiration_date, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ updatedID: id });
        });
});

app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM products WHERE id = ?`, id, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ deletedID: id });
    });
});

app.post('/finalize-sale', async (req, res) => {
    const { products, payment_methods, total_amount, cash_amount, change_amount } = req.body;
    const saleDate = new Date().toISOString();
    let totalNetProfit = 0;

    try {
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Insertar la venta en la tabla 'sales'
                db.run('INSERT INTO sales (sale_date, total_amount, payment_methods) VALUES (?, ?, ?)',
                    [saleDate, total_amount, payment_methods.join(', ')],
                    function(err) {
                        if (err) {
                            return db.run('ROLLBACK', () => reject(err));
                        }
                        const saleId = this.lastID;

                        // Procesar cada producto
                        const processProducts = products.map(product => {
                            return new Promise((resolveProduct, rejectProduct) => {
                                db.get('SELECT purchase_price FROM products WHERE id = ?', [product.id], (err, row) => {
                                    if (err) return rejectProduct(err);
                                    
                                    const netProfit = (product.sale_price - row.purchase_price) * product.quantity;
                                    totalNetProfit += netProfit;

                                    db.run('INSERT INTO sale_items (sale_id, product_id, quantity, net_profit) VALUES (?, ?, ?, ?)',
                                        [saleId, product.id, product.quantity, netProfit], (err) => {
                                            if (err) return rejectProduct(err);

                                            db.run('UPDATE products SET quantity = quantity - ? WHERE id = ?',
                                                [product.quantity, product.id], (err) => {
                                                    if (err) return rejectProduct(err);
                                                    resolveProduct();
                                                });
                                        });
                                });
                            });
                        });

                        Promise.all(processProducts)
                            .then(() => {
                                // Actualizar el net_profit en la tabla 'sales'
                                db.run('UPDATE sales SET net_profit = ? WHERE sale_id = ?', [totalNetProfit, saleId], (err) => {
                                    if (err) return db.run('ROLLBACK', () => reject(err));

                                    // Registrar el ingreso de efectivo y el cambio si aplica
                                    if (cash_amount > 0) {
                                        db.run('INSERT INTO daily_cash_control (fecha_hora, motivo_ingreso, descripcion, monto) VALUES (?, ?, ?, ?)',
                                            [saleDate, 'Ingreso por venta', `Venta ID: ${saleId}`, cash_amount]);
                                    }
                                    if (change_amount > 0) {
                                        db.run('INSERT INTO daily_cash_control (fecha_hora, motivo_egreso, descripcion, monto) VALUES (?, ?, ?, ?)',
                                            [saleDate, 'Cambio por venta', `Venta ID: ${saleId}`, change_amount]);
                                    }

                                    db.run('COMMIT', resolve);
                                });
                            })
                            .catch(err => db.run('ROLLBACK', () => reject(err)));
                    });
            });
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Error en la transacción:', err.message);
        res.status(500).json({ error: err.message });
    }
});

 
// Rutas para controlar la carga de productos ficticios (si aplica)
app.get('/start', (req, res) => {
    startAddingProducts();
    res.send('Comenzó la carga de productos ficticios.');
});

app.get('/stop', (req, res) => {
    stopAddingProducts();
    res.send('Se detuvo la carga de productos ficticios.');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
