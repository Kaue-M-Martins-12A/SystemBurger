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
            profile_picture TEXT,
            address TEXT
        )
    `);

    // Migração de banco existente (adiciona coluna se não existir)
    try {
        await db.exec('ALTER TABLE users ADD COLUMN profile_picture TEXT');
    } catch (e) { }

    try {
        await db.exec('ALTER TABLE users ADD COLUMN address TEXT');
    } catch (e) { }

    try {
        await db.exec('ALTER TABLE orders ADD COLUMN address TEXT');
    } catch (e) { }

    try {
        await db.exec('ALTER TABLE products ADD COLUMN category TEXT');
    } catch (e) { }

    // Tabela de Produtos
    await db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image TEXT,
            category TEXT
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
            address TEXT,
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
            // Burgers
            { name: 'X-Burger Clássico', desc: 'Hambúrguer de 180g, queijo cheddar, alface, tomate e molho especial.', price: 25.0, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60', category: 'burgers' },
            { name: 'Duplo Bacon', desc: 'Dois hambúrgueres de 180g, muito queijo cheddar e fatias crocantes de bacon.', price: 32.0, image: 'https://images.unsplash.com/photo-1594212586737-08c407842dd7?auto=format&fit=crop&w=500&q=60', category: 'burgers' },
            { name: 'Frango Crocante', desc: 'Peito de frango empanado, maionese temperada e alface americana.', price: 22.0, image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=500&q=60', category: 'burgers' },

            // Acompanhamentos
            { name: 'Batata Frita', desc: 'Porção individual de batatas fritas crocantes.', price: 12.0, image: 'https://images.unsplash.com/photo-1573080493719-44933d980456?auto=format&fit=crop&w=500&q=60', category: 'acompanhamentos' },
            { name: 'Anéis de Cebola', desc: 'Porção de anéis de cebola crocantes.', price: 15.0, image: 'https://images.unsplash.com/photo-1639024471283-035188835111?auto=format&fit=crop&w=500&q=60', category: 'acompanhamentos' },

            // Bebidas
            { name: 'Refrigerante Lata', desc: 'Lata 350ml (Coca-Cola, Guaraná, Fanta).', price: 6.0, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60', category: 'bebidas' },
            { name: 'Suco Natural', desc: 'Suco de laranja feito na hora 400ml.', price: 8.0, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60', category: 'bebidas' },

            // Sobremesas
            { name: 'Brownie Especial', desc: 'Brownie de chocolate belga com nozes.', price: 14.0, image: 'https://images.unsplash.com/photo-1589119908995-c6837fa14878?auto=format&fit=crop&w=500&q=60', category: 'sobremesas' },
            { name: 'Milkshake Morango', desc: 'Milkshake cremoso com calda de morango.', price: 18.0, image: 'https://images.unsplash.com/photo-1553787499-6f913386001c?auto=format&fit=crop&w=500&q=60', category: 'sobremesas' }
        ];

        for (const p of defaultProducts) {
            await db.run(
                'INSERT INTO products (name, description, price, image, category) VALUES (?, ?, ?, ?, ?)',
                [p.name, p.desc, p.price, p.image, p.category]
            );
        }
    }
}

module.exports = { getDb };
