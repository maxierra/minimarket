<<<<<<< HEAD
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const app = express();
const port = 3000;

// Configurar middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("views"));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Servir imágenes estáticamente

// Configurar Express para renderizar vistas EJS desde la carpeta 'views'
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Configurar la base de datos SQLite3
const db = new sqlite3.Database("./products.db");

// Configurar multer para almacenar imágenes en la carpeta 'uploads'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Crear tablas si no existen y agregar columnas nuevas si faltan
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
        expiration_date TEXT NOT NULL,
        category_en TEXT,
        image_filename TEXT
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS daily_cash_control (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_hora TEXT NOT NULL,
        motivo_egreso TEXT,
        motivo_ingreso TEXT,
        descripcion TEXT,
        monto REAL NOT NULL
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS sales (
        sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        net_profit REAL,
        payment_methods TEXT
    )`);

  // Crear la tabla de proveedores si no existe
  db.run(
    `CREATE TABLE IF NOT EXISTS providers (
  provider_id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  cuit TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  contact_name TEXT
)`,
    (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Tabla de proveedores creada o ya existía.");
    }
  );

// Crear la tabla de pedidos con los campos adicionales
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS orders (
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_name TEXT NOT NULL,
      contact_person TEXT,
      order_date TEXT NOT NULL,
      delivery_date TEXT,
      order_status TEXT,
      payment_status TEXT,
      ordered_quantity INTEGER,
      order_description TEXT,
      invoice_number TEXT
  )`);
});

  // Crear la tabla commerce si no existe
  db.run(
    `CREATE TABLE IF NOT EXISTS commerce (
          commerce_id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          cuit TEXT NOT NULL,
          tax_situation TEXT NOT NULL,
          start_of_activities DATE NOT NULL,
          ticket_start_number INTEGER NOT NULL
      )`,
    (err) => {
      if (err) {
        console.error("Error al crear la tabla commerce:", err.message);
      } else {
        console.log("Tabla commerce creada con éxito.");
      }
    }
  );

  // Crear la tabla de usuarios
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       username TEXT NOT NULL UNIQUE,
       password TEXT NOT NULL,
       role TEXT NOT NULL
)`,
    (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Tabla de usuarios creada o ya existe.");
    }
  );

  db.run(`CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        net_profit REAL DEFAULT 0,
        FOREIGN KEY (sale_id) REFERENCES sales(sale_id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

  db.all("PRAGMA table_info(products)", (err, columns) => {
    if (err) {
      console.error(
        "Error al obtener información de la tabla products:",
        err.message
      );
      return;
    }

    const columnNames = columns.map((column) => column.name);
    if (!columnNames.includes("category_en")) {
      db.run("ALTER TABLE products ADD COLUMN category_en TEXT");
    }
    if (!columnNames.includes("image_filename")) {
      db.run("ALTER TABLE products ADD COLUMN image_filename TEXT");
    }
  });
});

// Ruta para servir la página de login
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
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

// Ruta para la página principal, redirige a login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Ruta para la página principal
app.get("/main", (req, res) => {
  res.render("main");
});

// Rutas principales
app.get("/", (req, res) => {
  res.render("main.ejs");
});

app.get("/caja_diaria", (req, res) => {
  res.render("caja_diaria");
});

app.get("/reportesventas", (req, res) => {
  res.render("reportesventas");
});

app.get("/inventario", (req, res) => {
  res.render("inventario.ejs");
});

app.get("/ventas", (req, res) => {
  res.render("ventas.ejs");
});

app.get("/bulk-upload", (req, res) => {
  res.render("bulk_upload");
});

// Ruta para la página de configuración
app.get("/configuracion", (req, res) => {
  res.render("configuracion");
});

// Ruta para servir la página crear_comercio.ejs
app.get("/crear-comercio", (req, res) => {
  res.render("crear_comercio");
});

// Ruta para renderizar la página proveedores.ejs
app.get('/proveedores', (req, res) => {
  res.render('proveedores', { title: 'Proveedores' });
});

// Ruta principal para servir la página de pedidos
app.get('/pedidos', (req, res) => {
  res.render('pedidos.ejs');
});


// Ruta para obtener los datos del comercio por ID
app.get("/get-commerce-data/:id", (req, res) => {
  const sql = "SELECT * FROM commerce WHERE commerce_id = ?";
  const params = [req.params.id];
  db.get(sql, params, (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

app.get("/ranking_productos", (req, res) => {
  // Consulta para obtener los productos más y menos vendidos desde la tabla 'sale_items'
  const query = `
      SELECT 
          product_id, 
          SUM(quantity) as total_sold 
      FROM 
          sale_items 
      GROUP BY 
          product_id 
      ORDER BY 
          total_sold DESC
      LIMIT 10;  -- Cambia el límite según necesites para obtener más o menos productos
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Aquí renderizas tu página EJS 'ranking_productos.ejs' pasando los datos obtenidos
    res.render("ranking_productos", { productosMasVendidos: rows });
  });
});

app.get("/all-sale-items", (req, res) => {
  const query = `
      SELECT 
          si.product_id, 
          p.name as product_name,
          SUM(si.quantity) as total_quantity 
      FROM 
          sale_items si
      JOIN 
          products p 
      ON 
          si.product_id = p.id
      GROUP BY 
          si.product_id, p.name
      ORDER BY 
          total_quantity DESC

            LIMIT 10
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ saleItems: rows });
  });
});

app.post('/add-order', (req, res) => {
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
app.get('/get-orders', (req, res) => {
  let sql = `SELECT * FROM orders`;
  db.all(sql, [], (err, rows) => {
      if (err) {
          throw err;
      }
      res.json({ orders: rows });
  });
});

// 3. Obtener un pedido por ID
app.get('/get-order/:id', (req, res) => {
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
app.put('/update-order/:id', (req, res) => {
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
app.delete('/delete-order/:id', (req, res) => {
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


// Ruta para obtener todos los proveedores
app.get('/get-providers', (req, res) => {
  db.all('SELECT * FROM providers', (err, rows) => {
      if (err) {
          return res.status(500).send(err.message);
      }
      res.json({ providers: rows });
  });
});

// Ruta para agregar un proveedor
app.post('/add-provider', (req, res) => {
  const { company_name, cuit, phone, email, contact_name } = req.body;
  db.run(`INSERT INTO providers (company_name, cuit, phone, email, contact_name) VALUES (?, ?, ?, ?, ?)`,
      [company_name, cuit, phone, email, contact_name],
      function(err) {
          if (err) {
              return res.status(500).send(err.message);
          }
          res.json({ message: 'Proveedor agregado exitosamente', provider_id: this.lastID });
      });
});

// Ruta para obtener un proveedor específico
app.get('/get-provider/:id', (req, res) => {
  const providerId = req.params.id;
  db.get('SELECT * FROM providers WHERE provider_id = ?', [providerId], (err, row) => {
      if (err) {
          return res.status(500).send(err.message);
      }
      res.json(row);
  });
});

// Ruta para editar un proveedor
app.put('/edit-provider/:id', (req, res) => {
  const providerId = req.params.id;
  const { company_name, cuit, phone, email, contact_name } = req.body;
  db.run(`UPDATE providers SET company_name = ?, cuit = ?, phone = ?, email = ?, contact_name = ? WHERE provider_id = ?`,
      [company_name, cuit, phone, email, contact_name, providerId],
      function(err) {
          if (err) {
              return res.status(500).send(err.message);
          }
          res.json({ message: 'Proveedor actualizado exitosamente' });
      });
});

// Ruta para eliminar un proveedor
app.delete('/delete-provider/:id', (req, res) => {
  const providerId = req.params.id;
  db.run('DELETE FROM providers WHERE provider_id = ?', [providerId], function(err) {
      if (err) {
          return res.status(500).send(err.message);
      }
      res.json({ message: 'Proveedor eliminado exitosamente' });
  });
});



// Ruta para crear un nuevo comercio
app.post("/create-commerce", (req, res) => {
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
app.put("/update-commerce/:id", (req, res) => {
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

// Ruta para eliminar un comercio
app.delete("/delete-commerce/:id", (req, res) => {
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
app.get("/get-commerce-data", (req, res) => {
  const sql = "SELECT * FROM commerce";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API para manejar usuarios
app.get("/api/users", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post("/api/users", (req, res) => {
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

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;

  // Busca el usuario en la base de datos
  db.get(`SELECT * FROM users WHERE id = ?`, id, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Verifica si el usuario es el usuario admin
    if (row && row.username === "admin" && row.password === "admin2024") {
      res.status(403).json({ error: "No se puede eliminar el usuario admin" });
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

app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  // Busca el usuario en la base de datos
  db.get(`SELECT * FROM users WHERE id = ?`, id, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Verifica si el usuario es el usuario admin
    if (row && row.username === "admin" && row.password === "admin2024") {
      res.status(403).json({ error: "No se puede editar el usuario admin" });
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

// Ruta para insertar un registro de caja diaria
app.post("/insert-daily-cash", (req, res) => {
  const { fecha_hora, motivo_egreso, motivo_ingreso, descripcion, monto } =
    req.body;
  const query = `INSERT INTO daily_cash_control (fecha_hora, motivo_egreso, motivo_ingreso, descripcion, monto) VALUES (?, ?, ?, ?, ?)`;
  db.run(
    query,
    [fecha_hora, motivo_egreso, motivo_ingreso, descripcion, monto],
    function (err) {
      if (err) {
        console.error(
          "Error al insertar el registro de caja diaria:",
          err.message
        );
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Ruta para obtener los registros de caja diaria
app.get("/get-daily-cash-records", (req, res) => {
  const query = `SELECT * FROM daily_cash_control ORDER BY fecha_hora DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(
        "Error al obtener los registros de caja diaria:",
        err.message
      );
      res.json({ success: false });
    } else {
      res.json({ success: true, records: rows });
    }
  });
});

// Ruta para subir imágenes de productos
app.post("/upload-image", upload.single("image"), (req, res) => {
  const imageFilename = req.file.filename;
  res.json({ filename: imageFilename });
});

app.put("/products/:id", (req, res) => {
  const { id } = req.params;
  const {
    purchase_price,
    percentage_increase,
    sale_price,
    quantity,
    expiration_date,
  } = req.body;
  console.log("Precio de Compra recibido:", purchase_price);

  const stmt = db.prepare(`
        UPDATE products SET
          purchase_price = ?,
          percentage_increase = ?,
          sale_price = ?,
          quantity = ?,
          expiration_date = ?
        WHERE id = ?
    `);

  stmt.run(
    [
      purchase_price,
      percentage_increase,
      sale_price,
      quantity,
      expiration_date,
      id,
    ],
    function (err) {
      if (err) {
        console.error("Error al actualizar el producto:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ updatedID: id });
    }
  );
});

// Rutas CRUD para productos
app.post("/products", upload.single("image"), (req, res) => {
  const {
    name,
    brand,
    purchase_price,
    percentage_increase,
    sale_price,
    quantity,
    category,
    expiration_date,
    category_en,
  } = req.body;
  const image_filename = req.file ? req.file.filename : null;

  db.run(
    `INSERT INTO products (name, brand, purchase_price, percentage_increase, sale_price, quantity, category, expiration_date, category_en, image_filename) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      brand,
      purchase_price,
      percentage_increase,
      sale_price,
      quantity,
      category,
      expiration_date,
      category_en,
      image_filename,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

// Ruta para cargar el archivo CSV
app.post("/bulk-upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se subió ningún archivo" });
  }

  const filePath = req.file.path;
  const products = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (row) => {
      products.push({
        name: row.Nombre,
        brand: row.Marca,
        purchase_price: row["Precio Compra"],
        percentage_increase: row["Aumento Porcentaje"],
        sale_price: row["Precio Venta"],
        quantity: row.Cantidad,
        category: row.Categoría,
        expiration_date: row["Fecha Vencimiento"],
        category_en: row["Categoría EN"],
      });
    })
    .on("end", () => {
      // Aquí puedes insertar los productos en la base de datos
      products.forEach((product) => {
        db.run(
          `INSERT INTO products (name, brand, purchase_price, percentage_increase, sale_price, quantity, category, expiration_date, category_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.name,
            product.brand,
            product.purchase_price,
            product.percentage_increase,
            product.sale_price,
            product.quantity,
            product.category,
            product.expiration_date,
            product.category_en,
          ],
          (err) => {
            if (err) {
              console.error("Error al insertar producto:", err.message);
            }
          }
        );
      });

      res.json({ success: true, message: "Productos cargados exitosamente" });
    });
});

app.get("/products", (req, res) => {
  db.all(`SELECT * FROM products`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ products: rows });
  });
});

app.get("/products/:id", (req, res) => {
  const { id } = req.params;
  db.get(
    `SELECT id, name, brand, sale_price, image_filename FROM products WHERE id = ?`,
    [id],
    (err, row) => {
      // Incluyendo image_filename
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row);
    }
  );
});
app.delete("/products/:id", (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM products WHERE id = ?`, id, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ deletedID: id });
  });
});

app.post("/finalize-sale", async (req, res) => {
  const {
    products,
    payment_methods,
    total_amount,
    cash_amount,
    change_amount,
  } = req.body;
  const saleDate = new Date().toISOString();
  let totalNetProfit = 0;

  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Insertar la venta en la tabla 'sales'
        db.run(
          "INSERT INTO sales (sale_date, total_amount, payment_methods) VALUES (?, ?, ?)",
          [saleDate, total_amount, payment_methods.join(", ")],
          function (err) {
            if (err) {
              return db.run("ROLLBACK", () => reject(err));
            }
            const saleId = this.lastID;

            // Procesar cada producto
            const processProducts = products.map((product) => {
              return new Promise((resolveProduct, rejectProduct) => {
                db.get(
                  "SELECT purchase_price FROM products WHERE id = ?",
                  [product.id],
                  (err, row) => {
                    if (err) return rejectProduct(err);

                    const netProfit =
                      (product.sale_price - row.purchase_price) *
                      product.quantity;
                    totalNetProfit += netProfit;

                    db.run(
                      "INSERT INTO sale_items (sale_id, product_id, quantity, net_profit) VALUES (?, ?, ?, ?)",
                      [saleId, product.id, product.quantity, netProfit],
                      (err) => {
                        if (err) return rejectProduct(err);

                        db.run(
                          "UPDATE products SET quantity = quantity - ? WHERE id = ?",
                          [product.quantity, product.id],
                          (err) => {
                            if (err) return rejectProduct(err);
                            resolveProduct();
                          }
                        );
                      }
                    );
                  }
                );
              });
            });

            Promise.all(processProducts)
              .then(() => {
                // Actualizar el net_profit en la tabla 'sales'
                db.run(
                  "UPDATE sales SET net_profit = ? WHERE sale_id = ?",
                  [totalNetProfit, saleId],
                  (err) => {
                    if (err) return db.run("ROLLBACK", () => reject(err));

                    // Registrar el ingreso de efectivo y el cambio si aplica
                    if (cash_amount > 0) {
                      db.run(
                        "INSERT INTO daily_cash_control (fecha_hora, motivo_ingreso, descripcion, monto) VALUES (?, ?, ?, ?)",
                        [
                          saleDate,
                          "Ingreso por venta",
                          `Venta ID: ${saleId}`,
                          cash_amount,
                        ]
                      );
                    }
                    if (change_amount > 0) {
                      db.run(
                        "INSERT INTO daily_cash_control (fecha_hora, motivo_egreso, descripcion, monto) VALUES (?, ?, ?, ?)",
                        [
                          saleDate,
                          "Cambio por venta",
                          `Venta ID: ${saleId}`,
                          change_amount,
                        ]
                      );
                    }

                    db.run("COMMIT", resolve);
                  }
                );
              })
              .catch((err) => db.run("ROLLBACK", () => reject(err)));
          }
        );
      });
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error en la transacción:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Ruta para buscar productos por ID
app.get("/search-product", (req, res) => {
  const { id } = req.query;
  const query = `SELECT * FROM products WHERE id = ?`;

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error("Error al buscar el producto:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    }
    res.json({ success: true, product: row });
  });
});

app.get("/sales-reports", (req, res) => {
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
    query += " AND DATE(sale_date) >= ?";
    params.push(startDate);
  }

  if (endDate) {
    query += " AND DATE(sale_date) <= ?";
    params.push(endDate);
  }

  query += " GROUP BY DATE(sale_date) ORDER BY DATE(sale_date) ASC";

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, records: rows });
  });
});

app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});
=======
const os = require('os');
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const initializeDatabase = require("./db/creardb"); // Importar la función
const loginRoutes = require("./routes/loginroutes"); // Importar las rutas de login
const dailyCashRoutes = require("./routes/dailycash"); // Ajusta el path según tu estructura de carpetas
const providerRoutes = require("./routes/providers"); // Ajusta el path según tu estructura de carpetas
const commerceRoutes = require("./routes/commerce"); // Ajusta el path según tu estructura de carpetas
const userRoutes = require('./routes/users'); // Ajusta el path según tu estructura de carpetas
const pedidosRoutes = require('./routes/pedidos');


const app = express();
const port = 3000;

// Configurar middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("views"));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Servir imágenes estáticamente
app.use("/dailycash", dailyCashRoutes);
app.use("/providers", providerRoutes); // Aquí se registran las rutas para los proveedores
app.use("/commerce", commerceRoutes); // Aquí se registran las rutas para los comercios
app.use('/users', userRoutes); // Aquí se registran las rutas para los usuarios
app.use('/api/orders', pedidosRoutes);


// Configurar Express para renderizar vistas EJS desde la carpeta 'views'
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Configurar la base de datos SQLite3 usando la función importada
const db = initializeDatabase();

// Configurar multer para almacenar imágenes en la carpeta 'uploads'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Usar las rutas de login
app.use("/", loginRoutes);



// Ruta para la página principal, redirige a login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Ruta para la página principal
app.get("/main", (req, res) => {
  res.render("main");
});

// Rutas principales
app.get("/", (req, res) => {
  res.render("main.ejs");
});

app.get("/caja_diaria", (req, res) => {
  res.render("caja_diaria");
});

app.get("/reportesventas", (req, res) => {
  res.render("reportesventas");
});

app.get("/inventario", (req, res) => {
  res.render("inventario.ejs");
});

app.get("/ventas", (req, res) => {
  res.render("ventas.ejs");
});

app.get("/bulk-upload", (req, res) => {
  res.render("bulk_upload");
});

// Ruta para la página de configuración
app.get("/configuracion", (req, res) => {
  res.render("configuracion");
});

// Ruta para servir la página crear_comercio.ejs
app.get("/crear-comercio", (req, res) => {
  res.render("crear_comercio");
});

// Ruta para renderizar la página proveedores.ejs
app.get("/proveedores", (req, res) => {
  res.render("proveedores", { title: "Proveedores" });
});

// Ruta principal para servir la página de pedidos
app.get("/pedidos", (req, res) => {
  res.render("pedidos.ejs");
});

app.get("/ranking_productos", (req, res) => {
  // Consulta para obtener los productos más y menos vendidos desde la tabla 'sale_items'
  const query = `
      SELECT 
          product_id, 
          SUM(quantity) as total_sold 
      FROM 
          sale_items 
      GROUP BY 
          product_id 
      ORDER BY 
          total_sold DESC
      LIMIT 10;  -- Cambia el límite según necesites para obtener más o menos productos
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Aquí renderizas tu página EJS 'ranking_productos.ejs' pasando los datos obtenidos
    res.render("ranking_productos", { productosMasVendidos: rows });
  });
});


app.get("/all-sale-items", (req, res) => {
  const query = `
      SELECT 
          si.product_id, 
          p.name as product_name,
          SUM(si.quantity) as total_quantity 
      FROM 
          sale_items si
      JOIN 
          products p 
      ON 
          si.product_id = p.id
      GROUP BY 
          si.product_id, p.name
      ORDER BY 
          total_quantity DESC

            LIMIT 10
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ saleItems: rows });
  });
});



// Ruta para subir imágenes de productos
app.post("/upload-image", upload.single("image"), (req, res) => {
  const imageFilename = req.file.filename;
  res.json({ filename: imageFilename });
});

// PUT actualizar producto
app.put('/products/:id', upload.single('image'), (req, res) => {
  const { barcode, name, brand, purchase_price, percentage_increase, sale_price, quantity, category, category_en, expiration_date } = req.body;
  const image_filename = req.file ? req.file.filename : null;

  let sql = `UPDATE products SET 
             barcode = COALESCE(?, barcode), 
             name = COALESCE(?, name), 
             brand = COALESCE(?, brand), 
             purchase_price = COALESCE(?, purchase_price), 
             percentage_increase = COALESCE(?, percentage_increase), 
             sale_price = COALESCE(?, sale_price), 
             quantity = COALESCE(?, quantity), 
             category = COALESCE(?, category), 
             category_en = COALESCE(?, category_en), 
             expiration_date = COALESCE(?, expiration_date)`;

  let params = [barcode, name, brand, purchase_price, percentage_increase, sale_price, quantity, category, category_en, expiration_date];

  if (image_filename) {
    sql += `, image_filename = ?`;
    params.push(image_filename);
  }

  sql += ` WHERE id = ?`;
  params.push(req.params.id);

  db.run(sql, params, function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Producto actualizado exitosamente', changes: this.changes });
  });
});

app.post("/bulk-upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se subió ningún archivo" });
  }

  const filePath = req.file.path;
  const products = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (row) => {
      products.push({
        barcode: row.CodigoBarras, // Asumiendo que el CSV tiene una columna "CodigoBarras"
        name: row.Nombre,
        brand: row.Marca,
        purchase_price: row["Precio Compra"],
        percentage_increase: row["Aumento Porcentaje"],
        sale_price: row["Precio Venta"],
        quantity: row.Cantidad,
        category: row.Categoría,
        expiration_date: row["Fecha Vencimiento"],
        category_en: row["Categoría EN"],
      });
    })
    .on("end", () => {
      products.forEach((product) => {
        db.run(
          `INSERT INTO products (barcode, name, brand, purchase_price, percentage_increase, sale_price, quantity, category, expiration_date, category_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.barcode,
            product.name,
            product.brand,
            product.purchase_price,
            product.percentage_increase,
            product.sale_price,
            product.quantity,
            product.category,
            product.expiration_date,
            product.category_en,
          ],
          (err) => {
            if (err) {
              console.error("Error al insertar producto:", err.message);
            }
          }
        );
      });

      res.json({ success: true, message: "Productos cargados exitosamente" });
    });
});

app.post("/products", upload.single("image"), (req, res) => {
  const {
    barcode,
    name,
    brand,
    purchase_price,
    percentage_increase,
    sale_price,
    quantity,
    category,
    expiration_date,
    category_en,
  } = req.body;
  const image_filename = req.file ? req.file.filename : null;

  db.run(
    `INSERT INTO products (barcode, name, brand, purchase_price, percentage_increase, sale_price, quantity, category, expiration_date, category_en, image_filename) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      barcode,
      name,
      brand,
      purchase_price,
      percentage_increase,
      sale_price,
      quantity,
      category,
      expiration_date,
      category_en,
      image_filename,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.get("/products", (req, res) => {
  const sql = "SELECT * FROM products";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get("/products/:id", (req, res) => {
  const { id } = req.params;
  db.get(
    `SELECT id, barcode, name, brand, sale_price, image_filename FROM products WHERE id = ?`, // Incluyendo barcode
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(row);
    }
  );
});

app.delete("/products/:id", (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM products WHERE id = ?`, id, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ deletedID: id });
  });
});

app.post("/update-product/:id", async (req, res) => {
  const { id } = req.params;
  const {
    barcode,
    name,
    brand,
    category,
    category_en,
    purchase_price,
    percentage_increase,
    sale_price,
    quantity,
    expiration_date,
  } = req.body;

  try {
    await db.run(
      `
      UPDATE products
      SET barcode = ?,
          name = ?,
          brand = ?,
          category = ?,
          category_en = ?,
          purchase_price = ?,
          percentage_increase = ?,
          sale_price = ?,
          quantity = ?,
          expiration_date = ?
      WHERE id = ?
    `,
      [
        barcode,
        name,
        brand,
        category,
        category_en,
        purchase_price,
        percentage_increase,
        sale_price,
        quantity,
        expiration_date,
        id,
      ]
    );

    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating product", details: error.message });
  }
});

app.post("/finalize-sale", async (req, res) => {
  const {
    products,
    payment_methods,
    total_amount,
    cash_amount,
    change_amount,
  } = req.body;
  const saleDate = new Date().toISOString();
  let totalNetProfit = 0;

  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Insertar la venta en la tabla 'sales'
        db.run(
          "INSERT INTO sales (sale_date, total_amount, payment_methods) VALUES (?, ?, ?)",
          [saleDate, total_amount, payment_methods.join(", ")],
          function (err) {
            if (err) {
              return db.run("ROLLBACK", () => reject(err));
            }
            const saleId = this.lastID;

            // Procesar cada producto
            const processProducts = products.map((product) => {
              return new Promise((resolveProduct, rejectProduct) => {
                db.get(
                  "SELECT purchase_price FROM products WHERE id = ?",
                  [product.id],
                  (err, row) => {
                    if (err) return rejectProduct(err);

                    const netProfit =
                      (product.sale_price - row.purchase_price) *
                      product.quantity;
                    totalNetProfit += netProfit;

                    db.run(
                      "INSERT INTO sale_items (sale_id, product_id, quantity, net_profit) VALUES (?, ?, ?, ?)",
                      [saleId, product.id, product.quantity, netProfit],
                      (err) => {
                        if (err) return rejectProduct(err);

                        db.run(
                          "UPDATE products SET quantity = quantity - ? WHERE id = ?",
                          [product.quantity, product.id],
                          (err) => {
                            if (err) return rejectProduct(err);
                            resolveProduct();
                          }
                        );
                      }
                    );
                  }
                );
              });
            });

            Promise.all(processProducts)
              .then(() => {
                // Actualizar el net_profit en la tabla 'sales'
                db.run(
                  "UPDATE sales SET net_profit = ? WHERE sale_id = ?",
                  [totalNetProfit, saleId],
                  (err) => {
                    if (err) return db.run("ROLLBACK", () => reject(err));

                    // Registrar el ingreso de efectivo y el cambio si aplica
                    if (cash_amount > 0) {
                      db.run(
                        "INSERT INTO daily_cash_control (fecha_hora, motivo_ingreso, descripcion, monto) VALUES (?, ?, ?, ?)",
                        [
                          saleDate,
                          "Ingreso por venta",
                          `Venta ID: ${saleId}`,
                          cash_amount,
                        ]
                      );
                    }
                    if (change_amount > 0) {
                      db.run(
                        "INSERT INTO daily_cash_control (fecha_hora, motivo_egreso, descripcion, monto) VALUES (?, ?, ?, ?)",
                        [
                          saleDate,
                          "Cambio por venta",
                          `Venta ID: ${saleId}`,
                          change_amount,
                        ]
                      );
                    }

                    db.run("COMMIT", resolve);
                  }
                );
              })
              .catch((err) => db.run("ROLLBACK", () => reject(err)));
          }
        );
      });
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error en la transacción:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Ruta para buscar productos por ID
app.get("/search-product", (req, res) => {
  const { id } = req.query;
  const query = `SELECT * FROM products WHERE id = ?`;

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error("Error al buscar el producto:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    }
    res.json({ success: true, product: row });
  });
});

app.get("/sales-reports", (req, res) => {
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
    query += " AND DATE(sale_date) >= ?";
    params.push(startDate);
  }

  if (endDate) {
    query += " AND DATE(sale_date) <= ?";
    params.push(endDate);
  }

  query += " GROUP BY DATE(sale_date) ORDER BY DATE(sale_date) ASC";

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, records: rows });
  });
});

app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});
>>>>>>> 22176c3 (Primer commit)
