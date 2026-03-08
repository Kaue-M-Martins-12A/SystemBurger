// Authentication state management
const Auth = {
    isLoggedInState: false,
    user: null,

    isLoggedIn: () => Auth.isLoggedInState,
    getUser: () => Auth.user || {},

    init: async () => {
        try {
            const res = await fetch('/api/auth/check');
            const data = await res.json();
            Auth.isLoggedInState = data.isLoggedIn;
            Auth.user = data.user || null;
        } catch (e) {
            Auth.isLoggedInState = false;
        }
        Auth.updateHeader();

        // Custom event for pages that need auth info at startup (e.g. Profile)
        document.dispatchEvent(new Event('authLoaded'));
    },

    login: async (email, password) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                window.location.href = '/';
            } else {
                alert(data.error || 'Erro ao efetuar login');
            }
        } catch (error) {
            alert('Erro na conexão com o servidor.');
        }
    },

    register: async (name, email, password) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                window.location.href = '/';
            } else {
                alert(data.error || 'Erro ao efetuar cadastro');
            }
        } catch (error) {
            alert('Erro na conexão com o servidor.');
        }
    },

    logout: async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            alert('Erro ao sair da conta');
        }
    },

    updateHeader: () => {
        const headerActions = document.querySelector('.header-actions') || document.querySelector('.header-links');
        if (!headerActions) return;

        if (Auth.isLoggedIn()) {
            const loginLink = headerActions.querySelector('a[href="/login"]');
            if (loginLink || headerActions.innerHTML.includes('href="/login"')) {
                // If it's a div containing login/register
                const divContainer = headerActions.querySelector('div[style*="display: flex"]');
                const user = Auth.getUser();
                const profileImg = user.profile_picture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&q=80';

                const profileHTML = `
                    <a href="/perfil">
                        <img src="${profileImg}" alt="Profile" class="profile-img">
                    </a>
                `;
                if (divContainer) {
                    divContainer.outerHTML = profileHTML;
                } else if (loginLink) {
                    loginLink.outerHTML = profileHTML;
                }
            }
        } else {
            const profileLink = headerActions.querySelector('a[href="/perfil"]');
            if (profileLink) {
                profileLink.outerHTML = `
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <a href="/login" style="font-size: 0.9rem; font-weight: 500;">Login</a>
                        <a href="/cadastro" style="font-size: 0.9rem; font-weight: 500;">Cadastro</a>
                    </div>
                `;
            }
        }
    }
};

// Initialize auth state automatically on page load
document.addEventListener('DOMContentLoaded', Auth.init);
window.Auth = Auth;
