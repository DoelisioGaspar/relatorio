// =============== ADMIN PANEL ===============

let currentAdmin = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const session = getData('currentSession');
    if (!session || session.type !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    currentAdmin = session;

    // Display admin info
    document.getElementById('adminInfo').textContent = `${currentAdmin.nome} • ${currentAdmin.grupo}`;
    document.getElementById('grupoNomePub').textContent = currentAdmin.grupo;

    // Populate year selects
    populateYearSelect('filtroAno');
    populateYearSelect('lockAno');
    setCurrentMonth('filtroMes');
    setCurrentMonth('lockMes');

    // Sidebar navigation
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('sec-' + btn.dataset.section).classList.add('active');

            if (btn.dataset.section === 'relatorios') {
                carregarRelatorios();
            }
            if (btn.dataset.section === 'configuracoes') {
                atualizarLockStatus();
                listarMesesTrancados();
            }
        });
    });

    // Add publicador form
    document.getElementById('formAddPub').addEventListener('submit', (e) => {
        e.preventDefault();
        adicionarPublicador();
    });

    // Edit publicador form
    document.getElementById('formEditPub').addEventListener('submit', (e) => {
        e.preventDefault();
        salvarEdicaoPub();
    });

    // Load publicadores list
    listarPublicadores();
    listarMesesTrancados();
});

// =============== PUBLICADORES ===============

function adicionarPublicador() {
    const nome = document.getElementById('pubNome').value.trim();
    if (!nome) return;

    const pubs = getPublicadores();

    // Check duplicate in same group
    const existe = pubs.find(p =>
        normalizeStr(p.nome) === normalizeStr(nome) &&
        normalizeStr(p.grupo) === normalizeStr(currentAdmin.grupo)
    );

    if (existe) {
        showMsg('addPubMsg', 'Já existe um publicador com esse nome neste grupo.', 'error');
        return;
    }

    const novoPub = {
        id: generateId(),
        nome: nome,
        grupo: currentAdmin.grupo
    };

    pubs.push(novoPub);
    savePublicadores(pubs);

    document.getElementById('pubNome').value = '';
    showMsg('addPubMsg', `"${nome}" adicionado com sucesso!`, 'success');
    listarPublicadores();
}

function listarPublicadores() {
    const pubs = getPublicadores().filter(p =>
        normalizeStr(p.grupo) === normalizeStr(currentAdmin.grupo)
    );

    const tbody = document.querySelector('#tabelaPubs tbody');
    tbody.innerHTML = '';

    if (pubs.length === 0) {
        document.getElementById('noPubs').classList.remove('hidden');
        document.getElementById('tabelaPubs').classList.add('hidden');
        return;
    }

    document.getElementById('noPubs').classList.add('hidden');
    document.getElementById('tabelaPubs').classList.remove('hidden');

    pubs.sort((a, b) => a.nome.localeCompare(b.nome));

    pubs.forEach((pub, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${pub.nome}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-icon" onclick="editarPub('${pub.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-icon" onclick="removerPub('${pub.id}', '${pub.nome}')" title="Remover">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editarPub(pubId) {
    const pubs = getPublicadores();
    const pub = pubs.find(p => p.id === pubId);
    if (!pub) return;

    document.getElementById('editPubId').value = pub.id;
    document.getElementById('editPubNome').value = pub.nome;
    abrirModal('modalEditPub');
}

function salvarEdicaoPub() {
    const id = document.getElementById('editPubId').value;
    const novoNome = document.getElementById('editPubNome').value.trim();
    if (!novoNome) return;

    const pubs = getPublicadores();
    const idx = pubs.findIndex(p => p.id === id);
    if (idx === -1) return;

    // Check duplicate
    const existe = pubs.find(p =>
        p.id !== id &&
        normalizeStr(p.nome) === normalizeStr(novoNome) &&
        normalizeStr(p.grupo) === normalizeStr(currentAdmin.grupo)
    );

    if (existe) {
        alert('Já existe um publicador com esse nome neste grupo.');
        return;
    }

    // Also update relatorios with old name
    const nomeAntigo = pubs[idx].nome;
    pubs[idx].nome = novoNome;
    savePublicadores(pubs);

    // Update relatorios
    const rels = getRelatorios();
    rels.forEach(r => {
        if (r.pubId === id) {
            r.pubNome = novoNome;
        }
    });
    saveRelatorios(rels);

    fecharModal('modalEditPub');
    listarPublicadores();
}

function removerPub(pubId, nome) {
    if (!confirm(`Tem certeza que deseja remover "${nome}"?\nTodos os relatórios deste publicador serão mantidos.`)) return;

    let pubs = getPublicadores();
    pubs = pubs.filter(p => p.id !== pubId);
    savePublicadores(pubs);
    listarPublicadores();
}

// =============== RELATÓRIOS ===============

function carregarRelatorios() {
    const mes = parseInt(document.getElementById('filtroMes').value);
    const ano = parseInt(document.getElementById('filtroAno').value);

    const locked = isMonthLocked(currentAdmin.grupo, mes, ano);
    const titulo = `Relatório de Serviço de Campo — ${MESES[mes]} de ${ano} — ${currentAdmin.grupo}`;
    document.getElementById('tituloRelatorio').textContent = titulo;

    // Get all publicadores of the group
    const pubs = getPublicadores().filter(p =>
        normalizeStr(p.grupo) === normalizeStr(currentAdmin.grupo)
    );

    // Get relatorios for this month/year/group
    const rels = getRelatorios().filter(r =>
        normalizeStr(r.grupo) === normalizeStr(currentAdmin.grupo) &&
        r.mes == mes &&
        r.ano == ano
    );

    const tbody = document.querySelector('#tabelaRelatorios tbody');
    tbody.innerHTML = '';

    if (pubs.length === 0) {
        document.getElementById('noRelatorios').classList.remove('hidden');
        document.getElementById('tabelaRelatorios').classList.add('hidden');
        document.getElementById('resumoGeral').classList.add('hidden');
        document.getElementById('resumoPioneiros').classList.add('hidden');
        return;
    }

    document.getElementById('noRelatorios').classList.add('hidden');
    document.getElementById('tabelaRelatorios').classList.remove('hidden');

    pubs.sort((a, b) => a.nome.localeCompare(b.nome));

    let totalHoras = 0;
    let totalEstudos = 0;
    let totalEnviados = 0;
    let pionAuxCount = 0, pionAuxHoras = 0, pionAuxEstudos = 0;
    let pionRegCount = 0, pionRegHoras = 0, pionRegEstudos = 0;
    let pubCount = 0, pubHoras = 0, pubEstudos = 0;

    pubs.forEach((pub, idx) => {
        const rel = rels.find(r => r.pubId === pub.id);
        const tr = document.createElement('tr');

        if (rel) {
            totalEnviados++;
            const horas = parseInt(rel.horas) || 0;
            const estudos = parseInt(rel.estudos) || 0;

            if (rel.participou === 'Sim') {
                totalHoras += horas;
                totalEstudos += estudos;

                if (rel.designacao === 'Pioneiro Auxiliar') {
                    pionAuxCount++;
                    pionAuxHoras += horas;
                    pionAuxEstudos += estudos;
                } else if (rel.designacao === 'Pioneiro Regular') {
                    pionRegCount++;
                    pionRegHoras += horas;
                    pionRegEstudos += estudos;
                } else {
                    pubCount++;
                    pubHoras += horas;
                    pubEstudos += estudos;
                }
            }

            const designBadge = rel.participou === 'Nao' ? '-' :
                rel.designacao === 'Pioneiro Auxiliar' ? '<span class="badge badge-warning">Pion. Auxiliar</span>' :
                rel.designacao === 'Pioneiro Regular' ? '<span class="badge badge-info">Pion. Regular</span>' :
                '<span class="badge badge-secondary">Publicador</span>';

            const rowClass = rel.participou === 'Nao' ? 'row-inativo' : '';

            tr.className = rowClass;
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${pub.nome}</td>
                <td>${rel.participou === 'Sim' ? '<span class="badge badge-success">Sim</span>' : '<span class="badge badge-danger">Não</span>'}</td>
                <td>${designBadge}</td>
                <td>${rel.participou === 'Sim' ? horas : '-'}</td>
                <td>${rel.participou === 'Sim' ? estudos : '-'}</td>
                <td><span class="badge badge-success">Enviado</span></td>
            `;
        } else {
            tr.className = 'row-nao-enviou';
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${pub.nome}</td>
                <td colspan="4" style="text-align:center; color: var(--gray);">—</td>
                <td><span class="badge badge-danger">Não enviado</span></td>
            `;
        }

        tbody.appendChild(tr);
    });

    // Resumo Geral
    document.getElementById('resumoGeral').classList.remove('hidden');
    document.getElementById('totalPubs').textContent = pubs.length;
    document.getElementById('totalEnviados').textContent = totalEnviados;
    document.getElementById('totalHoras').textContent = totalHoras;
    document.getElementById('totalEstudos').textContent = totalEstudos;

    // Resumo Pioneiros
    document.getElementById('resumoPioneiros').classList.remove('hidden');
    const tbodyResumo = document.getElementById('tbodyResumoPioneiros');
    tbodyResumo.innerHTML = '';

    const designacoes = [
        { nome: 'Publicadores', qtd: pubCount, horas: pubHoras, estudos: pubEstudos },
        { nome: 'Pioneiros Auxiliares', qtd: pionAuxCount, horas: pionAuxHoras, estudos: pionAuxEstudos },
        { nome: 'Pioneiros Regulares', qtd: pionRegCount, horas: pionRegHoras, estudos: pionRegEstudos },
        { nome: 'TOTAL', qtd: pubCount + pionAuxCount + pionRegCount, horas: totalHoras, estudos: totalEstudos }
    ];

    designacoes.forEach((d, i) => {
        const tr = document.createElement('tr');
        if (i === designacoes.length - 1) {
            tr.style.fontWeight = '700';
            tr.style.background = '#f3f4f6';
        }
        tr.innerHTML = `
            <td>${d.nome}</td>
            <td>${d.qtd}</td>
            <td>${d.horas}</td>
            <td>${d.estudos}</td>
        `;
        tbodyResumo.appendChild(tr);
    });
}

// =============== PDF ===============

function gerarPDF() {
    const mes = parseInt(document.getElementById('filtroMes').value);
    const ano = parseInt(document.getElementById('filtroAno').value);

    const element = document.getElementById('cardRelatorio');

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `Relatorio_${currentAdmin.grupo}_${MESES[mes]}_${ano}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Temporarily adjust for PDF
    element.style.padding = '20px';

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.padding = '';
    });
}

// =============== LOCK/UNLOCK MONTHS ===============

function toggleLock() {
    const mes = parseInt(document.getElementById('lockMes').value);
    const ano = parseInt(document.getElementById('lockAno').value);
    const locks = getLockedMonths();

    const idx = locks.findIndex(l =>
        l.grupo === currentAdmin.grupo && l.mes == mes && l.ano == ano
    );

    if (idx >= 0) {
        // Unlock
        locks.splice(idx, 1);
        showMsg('lockMsg', `${MESES[mes]}/${ano} foi DESTRANCADO. Publicadores podem editar.`, 'success');
    } else {
        // Lock
        locks.push({ grupo: currentAdmin.grupo, mes: mes, ano: ano });
        showMsg('lockMsg', `${MESES[mes]}/${ano} foi TRANCADO. Publicadores não podem editar.`, 'info');
    }

    saveLockedMonths(locks);
    atualizarLockStatus();
    listarMesesTrancados();
}

function atualizarLockStatus() {
    const mes = parseInt(document.getElementById('lockMes').value);
    const ano = parseInt(document.getElementById('lockAno').value);
    const locked = isMonthLocked(currentAdmin.grupo, mes, ano);

    const statusEl = document.getElementById('lockStatus');
    if (locked) {
        statusEl.innerHTML = `<span class="badge badge-danger"><i class="fas fa-lock"></i> ${MESES[mes]}/${ano} está TRANCADO</span>`;
    } else {
        statusEl.innerHTML = `<span class="badge badge-success"><i class="fas fa-lock-open"></i> ${MESES[mes]}/${ano} está ABERTO</span>`;
    }
}

function listarMesesTrancados() {
    const locks = getLockedMonths().filter(l => l.grupo === currentAdmin.grupo);
    const container = document.getElementById('listaMesesTrancados');

    if (locks.length === 0) {
        container.innerHTML = '<p class="empty-msg"><i class="fas fa-info-circle"></i> Nenhum mês trancado.</p>';
        return;
    }

    locks.sort((a, b) => {
        if (a.ano !== b.ano) return b.ano - a.ano;
        return b.mes - a.mes;
    });

    container.innerHTML = locks.map(l =>
        `<span class="tag"><i class="fas fa-lock"></i> ${MESES[l.mes]}/${l.ano}</span>`
    ).join('');
}

// Update lock status when selects change
document.addEventListener('change', (e) => {
    if (e.target.id === 'lockMes' || e.target.id === 'lockAno') {
        atualizarLockStatus();
    }
});