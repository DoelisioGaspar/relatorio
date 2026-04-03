// =============== AUTH - LOGIN & REGISTER ===============

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const currentUser = getData('currentSession');
    if (currentUser) {
        if (currentUser.type === 'admin') {
            window.location.href = 'admin.html';
            return;
        } else {
            window.location.href = 'publicador.html';
            return;
        }
    }

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Admin Register
    document.getElementById('formAdminRegister').addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('adminRegNome').value.trim();
        const senha = document.getElementById('adminRegSenha').value;
        const senhaConfirm = document.getElementById('adminRegSenhaConfirm').value;
        const grupo = document.getElementById('adminRegGrupo').value.trim();

        if (senha !== senhaConfirm) {
            showMsg('loginMsg', 'As senhas não coincidem!', 'error');
            return;
        }

        if (senha.length < 4) {
            showMsg('loginMsg', 'A senha deve ter pelo menos 4 caracteres.', 'error');
            return;
        }

        const admins = getAdmins();

        // Check if group already has admin
        const existeGrupo = admins.find(a => normalizeStr(a.grupo) === normalizeStr(grupo));
        if (existeGrupo) {
            showMsg('loginMsg', `Já existe um admin para "${grupo}". Cada grupo pode ter apenas um admin.`, 'error');
            return;
        }

        const novoAdmin = {
            id: generateId(),
            nome: nome,
            senha: senha,
            grupo: grupo
        };

        admins.push(novoAdmin);
        saveAdmins(admins);

        showMsg('loginMsg', 'Admin criado com sucesso! Faça login.', 'success');
        document.getElementById('formAdminRegister').reset();

        // Switch to admin login tab
        setTimeout(() => {
            document.querySelector('[data-tab="admin-login"]').click();
        }, 1500);
    });

    // Admin Login
    document.getElementById('formAdminLogin').addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('adminLoginNome').value.trim();
        const senha = document.getElementById('adminLoginSenha').value;
        const grupo = document.getElementById('adminLoginGrupo').value.trim();

        const admins = getAdmins();
        const admin = admins.find(a =>
            normalizeStr(a.nome) === normalizeStr(nome) &&
            a.senha === senha &&
            normalizeStr(a.grupo) === normalizeStr(grupo)
        );

        if (admin) {
            setData('currentSession', {
                type: 'admin',
                id: admin.id,
                nome: admin.nome,
                grupo: admin.grupo
            });
            window.location.href = 'admin.html';
        } else {
            showMsg('loginMsg', 'Credenciais inválidas. Verifique nome, senha e grupo.', 'error');
        }
    });

    // Publicador Login
    document.getElementById('formPubLogin').addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('pubLoginNome').value.trim();
        const grupo = document.getElementById('pubLoginGrupo').value.trim();

        const pubs = getPublicadores();
        const pub = pubs.find(p =>
            normalizeStr(p.nome) === normalizeStr(nome) &&
            normalizeStr(p.grupo) === normalizeStr(grupo)
        );

        if (pub) {
            setData('currentSession', {
                type: 'publicador',
                id: pub.id,
                nome: pub.nome,
                grupo: pub.grupo
            });
            window.location.href = 'publicador.html';
        } else {
            showMsg('loginMsg', 'Publicador não encontrado. Verifique se seu nome e grupo estão corretos. Contacte seu admin.', 'error');
        }
    });
});