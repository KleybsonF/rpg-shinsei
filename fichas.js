import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from './firebase.js';

// Elements
const listaFichas = document.getElementById('lista-fichas');
    const btnNovaFicha = document.getElementById('btn-nova-ficha');
    const fichaEditor = document.getElementById('ficha-editor');
    const emptyState = document.getElementById('empty-state');
    
    const btnSalvar = document.getElementById('btn-salvar');
    const btnExcluir = document.getElementById('btn-excluir');
    
    // Inputs
    const inputNome = document.getElementById('ficha-nome');
    const inputFoto = document.getElementById('ficha-foto');
    const inputHistoria = document.getElementById('ficha-historia');
    const inputInventario = document.getElementById('ficha-inventario');
    const inputIsPlayer = document.getElementById('ficha-is-player');
    const loginFields = document.getElementById('login-fields');
    const inputLogin = document.getElementById('ficha-login');
    const inputSenha = document.getElementById('ficha-senha');
    
    const attrInputs = {
        forca: document.getElementById('attr-forca'),
        destreza: document.getElementById('attr-destreza'),
        mira: document.getElementById('attr-mira'),
        resistencia: document.getElementById('attr-resistencia'),
        agilidade: document.getElementById('attr-agilidade'),
        carisma: document.getElementById('attr-carisma'),
        intuicao: document.getElementById('attr-intuicao')
    };

    const statusInputs = {
        vidaAtual: document.getElementById('status-vida-atual'),
        vidaMax: document.getElementById('status-vida-max'),
        sanidadeAtual: document.getElementById('status-sanidade-atual'),
        sanidadeMax: document.getElementById('status-sanidade-max'),
        estaminaAtual: document.getElementById('status-estamina-atual'),
        estaminaMax: document.getElementById('status-estamina-max')
    };

    let fichas = [];
    let fichaAtualId = null;

    async function loadFichas() {
        const loggedPlayerId = sessionStorage.getItem('loggedPlayerId');
        const isMaster = sessionStorage.getItem('isMaster') === 'true';

        try {
            const querySnapshot = await getDocs(collection(db, "fichas"));
            
            // Segurança: Se não está logado e já existem fichas, redireciona pro login
            if (!querySnapshot.empty && !loggedPlayerId && !isMaster) {
                alert("Você não está logado! Redirecionando para a tela de login para validar suas permissões...");
                window.location.href = "login.html";
                return;
            }

            fichas = [];
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (isMaster || docSnap.id === loggedPlayerId || (!loggedPlayerId && querySnapshot.empty)) {
                    fichas.push({ id: docSnap.id, ...data });
                }
            });
            renderFichasList();
        } catch (error) {
            console.error('Erro ao carregar fichas do Firebase:', error);
            fichas = [];
        }
    }

    // Render Sidebar List
    function renderFichasList() {
        listaFichas.innerHTML = '';
        fichas.forEach(ficha => {
            const li = document.createElement('li');
            li.className = 'ficha-item';
            if (fichaAtualId === ficha.id) {
                li.classList.add('active');
            }
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'ficha-item-name';
            nameDiv.textContent = ficha.nome || 'Ficha Sem Nome';
            
            li.appendChild(nameDiv);
            li.addEventListener('click', () => selectFicha(ficha));
            
            listaFichas.appendChild(li);
        });
    }

    // Select Ficha
    function selectFicha(ficha) {
        fichaAtualId = ficha.id;
        
        // Fill form
        inputNome.value = ficha.nome || '';
        inputFoto.value = ficha.foto || '';
        inputHistoria.value = ficha.historia || '';
        inputInventario.value = ficha.inventario || '';
        inputIsPlayer.checked = ficha.isPlayer || false;
        inputLogin.value = ficha.login || '';
        inputSenha.value = ficha.senha || '';

        if (inputIsPlayer.checked) {
            loginFields.classList.remove('hidden');
        } else {
            loginFields.classList.add('hidden');
        }
        
        // Fill attributes
        const attrs = ficha.atributos || {};
        for (const key in attrInputs) {
            attrInputs[key].value = attrs[key] || 0;
        }

        // Fill status
        const stats = ficha.status || {};
        statusInputs.vidaAtual.value = stats.vidaAtual || 0;
        statusInputs.vidaMax.value = stats.vidaMax || 0;
        statusInputs.sanidadeAtual.value = stats.sanidadeAtual || 0;
        statusInputs.sanidadeMax.value = stats.sanidadeMax || 0;
        statusInputs.estaminaAtual.value = stats.estaminaAtual || 0;
        statusInputs.estaminaMax.value = stats.estaminaMax || 0;

        // Show editor
        fichaEditor.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        // Update list active state
        renderFichasList();
    }

    // Create New Ficha
    function createNovaFicha() {
        fichaAtualId = null; // null means new
        
        // Clear form
        inputNome.value = '';
        inputFoto.value = '';
        inputHistoria.value = '';
        inputInventario.value = '';
        inputIsPlayer.checked = false;
        inputLogin.value = '';
        inputSenha.value = '';
        loginFields.classList.add('hidden');
        
        for (const key in attrInputs) {
            attrInputs[key].value = 0;
        }
        
        for (const key in statusInputs) {
            statusInputs[key].value = 0;
        }

        fichaEditor.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        // Remove active class from list
        document.querySelectorAll('.ficha-item').forEach(item => item.classList.remove('active'));
    }

    // Save Ficha
    async function saveFicha() {
        const fichaData = {
            nome: inputNome.value.trim(),
            foto: inputFoto.value.trim(),
            historia: inputHistoria.value.trim(),
            inventario: inputInventario.value.trim(),
            isPlayer: inputIsPlayer.checked,
            login: inputIsPlayer.checked ? inputLogin.value.trim() : '',
            senha: inputIsPlayer.checked ? inputSenha.value : '',
            atributos: {},
            status: {
                vidaAtual: parseInt(statusInputs.vidaAtual.value) || 0,
                vidaMax: parseInt(statusInputs.vidaMax.value) || 0,
                sanidadeAtual: parseInt(statusInputs.sanidadeAtual.value) || 0,
                sanidadeMax: parseInt(statusInputs.sanidadeMax.value) || 0,
                estaminaAtual: parseInt(statusInputs.estaminaAtual.value) || 0,
                estaminaMax: parseInt(statusInputs.estaminaMax.value) || 0
            }
        };

        for (const key in attrInputs) {
            fichaData.atributos[key] = parseInt(attrInputs[key].value) || 0;
        }

        try {
            if (fichaAtualId) {
                // Update
                const fichaRef = doc(db, "fichas", fichaAtualId);
                await updateDoc(fichaRef, fichaData);
            } else {
                // Create
                const docRef = await addDoc(collection(db, "fichas"), fichaData);
                fichaAtualId = docRef.id;
            }
            
            alert('Ficha salva com sucesso!');
            await loadFichas();
            
            // Re-select to show active state
            const savedFicha = fichas.find(f => f.id === fichaAtualId);
            if(savedFicha) selectFicha(savedFicha);

        } catch (error) {
            console.error('Erro ao salvar no Firebase:', error);
            alert('Erro ao salvar ficha no banco de dados.');
        }
    }

    // Delete Ficha
    async function deleteFicha() {
        if (!fichaAtualId) {
            fichaEditor.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        if (confirm('Tem certeza que deseja excluir esta ficha? Essa ação não pode ser desfeita.')) {
            try {
                await deleteDoc(doc(db, "fichas", fichaAtualId));
                alert('Ficha excluída com sucesso!');
                
                fichaAtualId = null;
                fichaEditor.classList.add('hidden');
                emptyState.classList.remove('hidden');
                
                await loadFichas();
            } catch (error) {
                console.error('Erro ao excluir no Firebase:', error);
                alert('Erro ao excluir ficha no banco de dados.');
            }
        }
    }

    // Event Listeners
    btnNovaFicha.addEventListener('click', createNovaFicha);
    btnSalvar.addEventListener('click', saveFicha);
    btnExcluir.addEventListener('click', deleteFicha);
    
    inputIsPlayer.addEventListener('change', (e) => {
        if (e.target.checked) {
            loginFields.classList.remove('hidden');
        } else {
            loginFields.classList.add('hidden');
        }
    });

// Initial Load
loadFichas();
