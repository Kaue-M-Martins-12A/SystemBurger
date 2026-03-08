const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

const JWT_SECRET = 'burger_secret_key_123'; // Em produção, usar variável de ambiente

// --- AUTENTICAÇÃO ---

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        const db = await getDb();
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);

        if (existingUser) {
            return res.status(400).json({ error: 'Este e-mail já está em uso.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Auto-login after register
        const token = jwt.sign({ id: result.lastID, name, email }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({ message: 'Cadastro realizado com sucesso!', user: { id: result.lastID, name, email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno no servidor ao cadastrar.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }

        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({
            message: 'Login realizado com sucesso!', user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profile_picture: user.profile_picture
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno no servidor ao fazer login.' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout realizado com sucesso!' });
};

// Middleware para verificar token
exports.authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Não autorizado.' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

// --- PERFIL ---

exports.getProfile = async (req, res) => {
    try {
        const db = await getDb();
        const user = await db.get('SELECT id, name, email, phone, profile_picture, address FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao carregar perfil.' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
        }

        const db = await getDb();

        // Verifica se o e-mail não foi pego por outra pessoa
        const existingUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
        if (existingUser) return res.status(400).json({ error: 'Este e-mail já está em uso.' });

        await db.run(
            'UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            [name, email, phone || null, address || null, req.user.id]
        );

        res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
};

// --- CARRINHO E COMPRAS ---

exports.saveOrder = async (req, res) => {
    try {
        const { items, address } = req.body; // Array de { id, quantity, price } e endereço
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Carrinho vazio.' });
        }

        const db = await getDb();
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Inicia a compra
        const result = await db.run(
            'INSERT INTO orders (user_id, total, status, address) VALUES (?, ?, ?, ?)',
            [req.user.id, total, 'Aprovado', address || null] // Simulando já aprovado
        );
        const orderId = result.lastID;

        for (const item of items) {
            await db.run(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.id, item.quantity, item.price]
            );
        }

        res.json({ message: 'Pedido finalizado com sucesso!', orderId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao salvar pedido.' });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const db = await getDb();
        const orders = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pedidos.' });
    }
};

// --- PRODUTOS E RECOMENDAÇÕES ---

exports.getProducts = async (req, res) => {
    try {
        const db = await getDb();
        const products = await db.all('SELECT * FROM products');
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar produtos.' });
    }
};

exports.getRecommendations = async (req, res) => {
    try {
        const db = await getDb();

        // Retorna últimos itens comprados
        const lastPurchased = await db.all(`
            SELECT DISTINCT p.* 
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
            LIMIT 3
        `, [req.user.id]);

        // Retorna mais comprados no geral do restaurante (se o usuário não tiver compras, isso serve)
        const mostPopular = await db.all(`
            SELECT p.*, SUM(oi.quantity) as total_sold
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 3
        `);

        res.json({ lastPurchased, mostPopular });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar recomendações.' });
    }
};

// Verifica Status de Login (para frontend)
exports.checkAuth = async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ isLoggedIn: false });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = await getDb();
        const user = await db.get('SELECT id, name, email, profile_picture, address FROM users WHERE id = ?', [decoded.id]);

        if (user) {
            res.json({ isLoggedIn: true, user: user });
        } else {
            res.json({ isLoggedIn: false });
        }
    } catch (error) {
        res.json({ isLoggedIn: false });
    }
};

exports.updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        const userId = req.user.id;
        const profilePicturePath = `/uploads/${req.file.filename}`;

        const db = await getDb();
        await db.run('UPDATE users SET profile_picture = ? WHERE id = ?', [profilePicturePath, userId]);

        res.json({
            message: 'Foto de perfil atualizada com sucesso!',
            profile_picture: profilePicturePath
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar foto de perfil.' });
    }
};
