const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const apiController = require('../controllers/apiController');

// HTML Pages
router.get('/', pageController.getHome);
router.get('/login', pageController.getLogin);
router.get('/cadastro', pageController.getCadastro);
router.get('/cardapio', pageController.getCardapio);
router.get('/carrinho', pageController.getCarrinho);
router.get('/pagamento', pageController.getPagamento);
router.get('/perfil', pageController.getPerfil);

// API Rotas (Autenticação)
router.post('/api/auth/register', apiController.register);
router.post('/api/auth/login', apiController.login);
router.post('/api/auth/logout', apiController.logout);
router.get('/api/auth/check', apiController.checkAuth);

// API Rotas (Produtos)
router.get('/api/products', apiController.getProducts);

// API Rotas (Protegidas pelo Middleware de Auth)
router.get('/api/user/profile', apiController.authMiddleware, apiController.getProfile);
router.put('/api/user/profile', apiController.authMiddleware, apiController.updateProfile);
router.post('/api/orders', apiController.authMiddleware, apiController.saveOrder);
router.get('/api/orders', apiController.authMiddleware, apiController.getOrders);
router.get('/api/recommendations', apiController.authMiddleware, apiController.getRecommendations);

module.exports = router;
