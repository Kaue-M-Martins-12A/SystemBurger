const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Caminho para o arquivo do banco de dados SQLite
const dbPath = path.join(__dirname, '..', '..', 'burger.sqlite');

let dbPromise;

async function getDb() {
    if (!dbPromise) {
        dbPromise = open({
            filename: dbPath,
            driver: sqlite3.Database
        }).then(async (db) => {
            await initializeTables(db);
            return db;
        });
    }
    return dbPromise;
}

async function initializeTables(db) {
    // Tabela de Usuários
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            phone TEXT,
            profile_picture TEXT
        )
    `);

    // Migração de banco existente (adiciona coluna se não existir)
    try {
        await db.exec('ALTER TABLE users ADD COLUMN profile_picture TEXT');
    } catch (e) {
        // Ignora se a coluna já existir
    }

    // Tabela de Produtos
    await db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image TEXT
        )
    `);

    // Tabela de Itens do Carrinho
    await db.exec(`
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    `);

    // Tabela de Pedidos
    await db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendente',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    // Tabela de Itens do Pedido
    await db.exec(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL, -- Preço na hora da compra
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    `);

    // Inserir produtos iniciais de exemplo se a tabela estiver vazia
    const productCount = await db.get('SELECT COUNT(*) as count FROM products');
    if (productCount.count === 0) {
        const defaultProducts = [
            { name: 'X-Burger Clássico', desc: 'Hambúrguer de 180g, queijo cheddar, alface, tomate e molho especial.', price: 25.0, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { name: 'Duplo Bacon', desc: 'Dois hambúrgueres de 180g, muito queijo cheddar e fatias crocantes de bacon.', price: 32.0, image: 'https://images.unsplash.com/photo-1594212586737-08c407842dd7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { name: 'Frango Crocante', desc: 'Peito de frango empanado, maionese temperada e alface americana.', price: 22.0, image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { name: 'Combo Casal', desc: '2 X-Burgers, 2 Batatas Fritas Médias e 2 Refrigerantes lata.', price: 59.9, image: 'https://plus.unsplash.com/premium_photo-1683619761492-6390711c6c0b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
            { name: 'Combo Família', desc: '4 X-Burgers, Porção Gigante de Batata, Onion Rings e Refrigerante 2L.', price: 110.0, image: 'https://plus.unsplash.com/premium_photo-1683655058728-319cefa3ea22?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
            { name: 'Batata Frita', desc: 'Porção individual de batatas fritas crocantes.', price: 12.0, image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }
        ];

        for (const p of defaultProducts) {
            await db.run(
                'INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)',
                [p.name, p.desc, p.price, p.image]
            );
        }
    }
}

module.exports = { getDb };
