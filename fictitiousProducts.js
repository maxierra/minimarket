const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./products.db');

// Conectar a la base de datos
db.serialize(() => {
    // Crear la tabla si no existe
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
});

let intervalId;

// Marcas argentinas ficticias con sus nombres de visualización
const argentinianBrands = [
    { name: 'La Serenisima', displayName: 'La Serenísima' },
    { name: 'Jorgito', displayName: 'Jorgito' },
    { name: 'Havanna', displayName: 'Havanna' },
    { name: 'Arcor', displayName: 'Arcor' },
    { name: 'Terrabusi', displayName: 'Terrabusi' },
    { name: 'Bagley', displayName: 'Bagley' },
    { name: 'Tregar', displayName: 'Tregar' },
    { name: 'Manaos', displayName: 'Manaos' },
    { name: 'Quilmes', displayName: 'Quilmes' },
    { name: 'Paty', displayName: 'Paty' },
    { name: 'Ilolay', displayName: 'Ilolay' },
    { name: 'Molinos Río de la Plata', displayName: 'Molinos Río de la Plata' },
    { name: 'Mastellone Hnos.', displayName: 'Mastellone Hnos.' },
    // Agrega más marcas según sea necesario
];

function getRandomArgentinianBrand() {
    const randomIndex = Math.floor(Math.random() * argentinianBrands.length);
    return argentinianBrands[randomIndex];
}

// Nombres de productos ficticios
const fictitiousProductNames = [
    'Leche',
    'Alfajor',
    'Galletitas',
    'Yogur',
    'Queso',
    'Dulce de leche',
    'Empanadas',
    'Cerveza',
    'Vino',
    'Jugo',
    'Helado',
    'Pan',
    'Aceite',
    'Sal',
    'Azúcar',
    'Café',
    'Té',
    'Medialunas',
    'Chocolates',
    'Bizcochos',
    'Fiambres',
    'Lácteos',
    'Pastas',
    'Salsas',
    'Snacks',
    'Frutas secas',
    'Condimentos',
    'Pescado',
    'Pollo',
    'Carne',
    'Verduras',
    'Frutas',
    // Agrega más nombres de productos según sea necesario
];

function getRandomProductName() {
    const randomIndex = Math.floor(Math.random() * fictitiousProductNames.length);
    return fictitiousProductNames[randomIndex];
}

function addFictitiousProduct() {
    const brand = getRandomArgentinianBrand();
    const productName = getRandomProductName();

    const product = {
        name: `${productName} ${brand.displayName}`,
        brand: brand.name,
        purchase_price: (Math.random() * 100).toFixed(2),
        percentage_increase: (Math.random() * 100).toFixed(2),
        quantity: Math.floor(Math.random() * 100),
        category: 'Alimentos', // Categoría ficticia para productos de un almacén
        expiration_date: new Date(Date.now() + Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0]
    };
    product.sale_price = (product.purchase_price * (1 + product.percentage_increase / 100)).toFixed(2);

    db.run(`INSERT INTO products (name, brand, purchase_price, percentage_increase, sale_price, quantity, category, expiration_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [product.name, brand.displayName, product.purchase_price, product.percentage_increase, product.sale_price, product.quantity, product.category, product.expiration_date],
        function (err) {
            if (err) {
                return console.error('Error inserting product:', err.message);
            }
            console.log(`Product added with ID: ${this.lastID}`);
        });
}

// Iniciar la carga de productos ficticios cada 10 segundos
function startAddingProducts() {
    intervalId = setInterval(addFictitiousProduct, 10000);
}

// Detener la carga de productos ficticios
function stopAddingProducts() {
    clearInterval(intervalId);
}

// Exportar las funciones para ser usadas en otro script si es necesario
module.exports = { startAddingProducts, stopAddingProducts };

// Iniciar automáticamente la carga de productos al ejecutar el script
startAddingProducts();

// O detenerla después de un cierto tiempo (por ejemplo, 60 segundos)
// setTimeout(stopAddingProducts, 60000);
