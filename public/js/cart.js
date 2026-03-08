// Shopping cart management
const Cart = {
    getItems: () => JSON.parse(localStorage.getItem('burger_cart') || '[]'),

    saveItems: (items) => {
        localStorage.setItem('burger_cart', JSON.stringify(items));
        Cart.updateCartCount();
    },

    addItem: (product) => {
        const items = Cart.getItems();
        const existing = items.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            items.push({ ...product, quantity: 1 });
        }
        Cart.saveItems(items);
        alert(`${product.name} adicionado ao carrinho!`);
    },

    removeItem: (productId) => {
        const items = Cart.getItems().filter(item => item.id !== productId);
        Cart.saveItems(items);
        if (typeof renderCart === 'function') renderCart();
    },

    updateQuantity: (productId, delta) => {
        const items = Cart.getItems();
        const item = items.find(i => i.id === productId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                Cart.removeItem(productId);
            } else {
                Cart.saveItems(items);
            }
        }
        if (typeof renderCart === 'function') renderCart();
    },

    updateCartCount: () => {
        const countElement = document.getElementById('cart-count');
        if (!countElement) return;
        const totalItems = Cart.getItems().reduce((sum, item) => sum + item.quantity, 0);
        countElement.textContent = totalItems;
        countElement.style.display = totalItems > 0 ? 'flex' : 'none';
    },

    checkout: async () => {
        if (!Auth.isLoggedIn()) {
            alert('Você precisa estar logado para finalizar a compra!');
            window.location.href = '/login';
            return;
        }

        const items = Cart.getItems();
        if (items.length === 0) {
            alert('Seu carrinho está vazio.');
            return;
        }

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });

            const data = await res.json();
            if (res.ok) {
                alert('Pedido finalizado com sucesso!');
                localStorage.removeItem('burger_cart');
                window.location.href = '/perfil';
            } else {
                alert(data.error || 'Erro ao finalizar pedido.');
            }
        } catch (error) {
            alert('Erro de conexão ao finalizar pedido.');
        }
    }
};

document.addEventListener('DOMContentLoaded', Cart.updateCartCount);
window.Cart = Cart;
