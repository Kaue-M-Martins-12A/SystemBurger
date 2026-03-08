const path = require('path');

exports.getHome = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'html', 'index.html'));
};

exports.getLogin = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'html', 'login.html'));
};

exports.getCadastro = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'html', 'cadastro.html'));
};

exports.getCardapio = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'html', 'cardapio.html'));
};

exports.getPagamento = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'html', 'pagamento.html'));
};

exports.getPerfil = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'html', 'perfil.html'));
};

exports.getCarrinho = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'html', 'carrinho.html'));
};
