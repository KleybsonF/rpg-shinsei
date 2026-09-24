import { db, collection, getDocs, query, where } from './firebase.js';

const loginForm = document.getElementById('login-form');
const inputUser = document.getElementById('login-user');
const inputPass = document.getElementById('login-pass');
const errorMsg = document.getElementById('login-error');
const btnLogin = document.getElementById('btn-login');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    errorMsg.classList.add('hidden');
    const user = inputUser.value.trim();
    const pass = inputPass.value;

    if (!user || !pass) return;

    btnLogin.textContent = 'AUTENTICANDO...';
    btnLogin.disabled = true;

    try {
        const q = query(
            collection(db, "fichas"), 
            where("isPlayer", "==", true),
            where("login", "==", user),
            where("senha", "==", pass)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const ficha = querySnapshot.docs[0];
            sessionStorage.setItem('loggedPlayerId', ficha.id);
            sessionStorage.setItem('loggedPlayerName', ficha.data().nome);
            
            // Redirect to mesa
            window.location.href = 'mesa.html';
        } else {
            errorMsg.textContent = 'Login ou senha inválidos.';
            errorMsg.classList.remove('hidden');
            btnLogin.textContent = 'ENTRAR';
            btnLogin.disabled = false;
        }
    } catch (error) {
        console.error('Erro no login:', error);
        errorMsg.textContent = 'Erro de conexão com o banco de dados.';
        errorMsg.classList.remove('hidden');
        btnLogin.textContent = 'ENTRAR';
        btnLogin.disabled = false;
    }
});
