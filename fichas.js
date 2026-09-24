document.addEventListener('DOMContentLoaded', () => {
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
        intuicao: document.getElementById('attr-intuicao'),
        estamina: document.getElementById('attr-estamina')
    };

    let fichas = [];
    let fichaAtualId = null;

    // Load Fichas
    async function loadFichas() {
        try {
            const response = await fetch('http://localhost:3000/api/data');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            fichas = data.fichas || [];
            renderFichasList();
        } catch (error) {
            console.error('Erro ao carregar fichas do servidor:', error);
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
            atributos: {}
        };

        for (const key in attrInputs) {
            fichaData.atributos[key] = parseInt(attrInputs[key].value) || 0;
        }

        try {
            if (fichaAtualId) {
                // Update
                const res = await fetch(`http://localhost:3000/api/fichas/${fichaAtualId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fichaData)
                });
                if (!res.ok) throw new Error('Falha ao atualizar');
            } else {
                // Create
                const res = await fetch('http://localhost:3000/api/fichas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fichaData)
                });
                if (!res.ok) throw new Error('Falha ao criar');
                const data = await res.json();
                fichaAtualId = data.ficha.id;
            }
            
            alert('Ficha salva com sucesso!');
            await loadFichas();
            
            // Re-select to show active state
            const savedFicha = fichas.find(f => f.id === fichaAtualId);
            if(savedFicha) selectFicha(savedFicha);

        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar ficha no servidor.');
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
                const res = await fetch(`http://localhost:3000/api/fichas/${fichaAtualId}`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error('Falha ao deletar');
                alert('Ficha excluída com sucesso!');
                
                fichaAtualId = null;
                fichaEditor.classList.add('hidden');
                emptyState.classList.remove('hidden');
                
                await loadFichas();
            } catch (error) {
                console.error('Erro ao excluir:', error);
                alert('Erro ao excluir ficha no servidor.');
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
});
