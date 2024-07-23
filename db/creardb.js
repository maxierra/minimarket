const sqlite3 = require("sqlite3").verbose();

function initializeDatabase() {
  const db = new sqlite3.Database("./products.db");

  db.serialize(() => {
    // Crear la tabla products si no existe
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

    // Verificar si la columna barcode ya existe
    db.all("PRAGMA table_info(products)", (err, columns) => {
      if (err) {
        console.error(err.message);
        return;
      }

      const columnExists = columns.some((column) => column.name === "barcode");

      // Si la columna no existe, agregarla
      if (!columnExists) {
        db.run(`ALTER TABLE products ADD COLUMN barcode TEXT`, (err) => {
          if (err) {
            console.error(err.message);
          } else {
            console.log("Columna 'barcode' agregada exitosamente.");
          }
        });
      } else {
        console.log("La columna 'barcode' ya existe.");
      }
    });

    // Crear la tabla daily_cash_control si no existe
    db.run(`CREATE TABLE IF NOT EXISTS daily_cash_control (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha_hora TEXT NOT NULL,
      motivo_egreso TEXT,
      motivo_ingreso TEXT,
      descripcion TEXT,
      monto REAL NOT NULL
    )`);

    // Crear la tabla sales si no existe
    db.run(`CREATE TABLE IF NOT EXISTS sales (
      sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      net_profit REAL,
      payment_methods TEXT
    )`);

    // Crear la tabla de proveedores si no existe
    db.run(`CREATE TABLE IF NOT EXISTS providers (
      provider_id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      cuit TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      contact_name TEXT
    )`, (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Tabla de proveedores creada o ya existía.");
    });

    // Crear la tabla de pedidos si no existe
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

    // Crear la tabla commerce si no existe
    db.run(`CREATE TABLE IF NOT EXISTS commerce (
      commerce_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      cuit TEXT NOT NULL,
      tax_situation TEXT NOT NULL,
      start_of_activities DATE NOT NULL,
      ticket_start_number INTEGER NOT NULL
    )`, (err) => {
      if (err) {
        console.error("Error al crear la tabla commerce:", err.message);
      } else {
        console.log("Tabla commerce creada con éxito.");
      }
    });

    // Crear la tabla de usuarios si no existe
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )`, (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("Tabla de usuarios creada o ya existe.");
    });

    // Crear la tabla sale_items si no existe
    db.run(`CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      net_profit REAL DEFAULT 0,
      FOREIGN KEY (sale_id) REFERENCES sales(sale_id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Verificar y agregar columnas adicionales a la tabla products si no existen
    db.all("PRAGMA table_info(products)", (err, columns) => {
      if (err) {
        console.error("Error al obtener información de la tabla products:", err.message);
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

  return db;
}

module.exports = initializeDatabase;