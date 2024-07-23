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

app.get('/generadordeprecios', (req, res) => {
  res.render('generadordeprecios');
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


app.get("/products/:id/basic-info", (req, res) => {
  const { id } = req.params;
  db.get(
    `SELECT name, sale_price FROM products WHERE id = ?`,
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