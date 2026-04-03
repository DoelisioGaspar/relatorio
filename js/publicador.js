// =============== PUBLICADOR PANEL ===============

let currentPub = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const session = getData('currentSession');
    if (!session || session.type !== 'publicador') {
        window.location.href = 'index.html';
        return;
    }
    currentPub = session;

    // Display info
    document.getElementById('pubInfo').textContent = `${currentPub.nome} • ${currentPub.grupo}`;

    // Populate selects
    populateYearSelect('relAno');
    setCurrentMonth('relMes');

    // Toggle participação
    document.querySelectorAll('input[name="participou"]').forEach(radio => {
        radio.addEventListener('change', toggleParticipacao);
    });

    // Toggle designação → horas
    document.getElementById('designacao').addEventListener('change', toggleHoras);

    // Check month lock on date change
    document.getElementById('relMes').addEventListener('change', verificarLockERelatorio);
    document.getElementById('relAno').addEventListener('change', verificarLockERelatorio);

    // Submit form
    document.getElementById('formRelatorio').addEventListener('submit', (e) => {
        e.preventDefault();
        enviarRelatorio();
    });

    // Initial states
    toggleParticipacao();
    toggleHoras();
    verificarLockERelatorio();
    listarHistorico();
});

function toggleParticipacao() {
    const sim = document.getElementById('participouSim').checked;
    const campos = document.getElementById('camposAtivos');

    if (sim) {
        campos.classList.remove('disabled');
    } else {
        campos.classList.add('disabled');
    }
}

function toggleHoras() {
    const designacao = document.getElementById('designacao').value;
    const grupoHoras = document.getElementById('grupoHoras');

    if (designacao === 'Pioneiro Auxiliar' || designacao === 'Pioneiro Regular') {
        grupoHoras.style.display = 'block';
    } else {
        grupoHoras.style.display = 'none';
        document.getElementById('horas').value = 0;
    }
}

function verificarLockERelatorio() {
    const mes = parseInt(document.getElementById('relMes').value);
    const ano = parseInt(document.getElementById('relAno').value);
    const locked = isMonthLocked(currentPub.grupo, mes, ano);
    const lockNotice = document.getElementById('lockNotice');
    const btnEnviar = document.getElementById('btnEnviar');

    if (locked) {
        lockNotice.classList.remove('hidden');
        btnEnviar.disabled = true;
        btnEnviar.style.opacity = '0.5';
        btnEnviar.style.cursor = 'not-allowed';
    } else {
        lockNotice.classList.add('hidden');
        btnEnviar.disabled = false;
        btnEnviar.style.opacity = '1';
        btnEnviar.style.cursor = 'pointer';
    }

    // Load existing report if any
    carregarRelatorioExistente(mes, ano);
}

function carregarRelatorioExistente(mes, ano) {
    const rels = getRelatorios();
    const rel = rels.find(r =>
        r.pubId === currentPub.id &&
        r.mes == mes &&
        r.ano == ano
    );

    if (rel) {
        // Fill form with existing data
        if (rel.participou === 'Sim') {
            document.getElementById('participouSim').checked = true;
        } else {
            document.getElementById('participouNao').checked = true;
        }
        toggleParticipacao();

        document.getElementById('designacao').value = rel.designacao || 'Publicador';
        toggleHoras();

        document.getElementById('horas').value = rel.horas || 0;
        document.getElementById('estudos').value = rel.estudos || 0;

        // Change button text
        document.getElementById('btnEnviar').innerHTML = '<i class="fas fa-save"></i> Atualizar Relatório';
    } else {
        // Reset form
        document.getElementById('participouNao').checked = true;
        toggleParticipacao();
        document.getElementById('designacao').value = 'Publicador';
        toggleHoras();
        document.getElementById('horas').value = 0;
        document.getElementById('estudos').value = 0;
        document.getElementById('btnEnviar').innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Relatório';
    }
}

function enviarRelatorio() {
    const mes = parseInt(document.getElementById('relMes').value);
    const ano = parseInt(document.getElementById('relAno').value);

    // Double-check lock
    if (isMonthLocked(currentPub.grupo, mes, ano)) {
        showMsg('relMsg', 'Este mês está trancado. Contacte seu admin.', 'error');
        return;
    }

    const participou = document.getElementById('participouSim').checked ? 'Sim' : 'Nao';
    const designacao = participou === 'Sim' ? document.getElementById('designacao').value : 'Publicador';
    const horas = participou === 'Sim' ? (parseInt(document.getElementById('horas').value) || 0) : 0;
    const estudos = participou === 'Sim' ? (parseInt(document.getElementById('estudos').value) || 0) : 0;

    const rels = getRelatorios();
    const existIdx = rels.findIndex(r =>
        r.pubId === currentPub.id &&
        r.mes == mes &&
        r.ano == ano
    );

    const relatorio = {
        id: existIdx >= 0 ? rels[existIdx].id : generateId(),
        pubId: currentPub.id,
        pubNome: currentPub.nome,
        grupo: currentPub.grupo,
        mes: mes,
        ano: ano,
        participou: participou,
        designacao: designacao,
        horas: horas,
        estudos: estudos,
        dataEnvio: new Date().toISOString()
    };

    if (existIdx >= 0) {
        rels[existIdx] = relatorio;
        showMsg('relMsg', `Relatório de ${MESES[mes]}/${ano} atualizado com sucesso!`, 'success');
    } else {
        rels.push(relatorio);
        showMsg('relMsg', `Relatório de ${MESES[mes]}/${ano} enviado com sucesso!`, 'success');
    }

    saveRelatorios(rels);
    verificarLockERelatorio();
    listarHistorico();
}

function listarHistorico() {
    const rels = getRelatorios()
        .filter(r => r.pubId === currentPub.id)
        .sort((a, b) => {
            if (a.ano !== b.ano) return b.ano - a.ano;
            return b.mes - a.mes;
        });

    const tbody = document.querySelector('#tabelaHistorico tbody');
    tbody.innerHTML = '';

    if (rels.length === 0) {
        document.getElementById('noHistorico').classList.remove('hidden');
        document.getElementById('tabelaHistorico').classList.add('hidden');
        return;
    }

    document.getElementById('noHistorico').classList.add('hidden');
    document.getElementById('tabelaHistorico').classList.remove('hidden');

    rels.forEach(rel => {
        const locked = isMonthLocked(currentPub.grupo, rel.mes, rel.ano);
        const tr = document.createElement('tr');

        const designBadge = rel.participou === 'Nao' ? '-' :
            rel.designacao === 'Pioneiro Auxiliar' ? '<span class="badge badge-warning">Pion. Auxiliar</span>' :
            rel.designacao === 'Pioneiro Regular' ? '<span class="badge badge-info">Pion. Regular</span>' :
            '<span class="badge badge-secondary">Publicador</span>';

        tr.innerHTML = `
            <td>${MESES[rel.mes]}/${rel.ano}</td>
            <td>${rel.participou === 'Sim' ? '<span class="badge badge-success">Sim</span>' : '<span class="badge badge-danger">Não</span>'}</td>
            <td>${designBadge}</td>
            <td>${rel.participou === 'Sim' ? rel.horas : '-'}</td>
            <td>${rel.participou === 'Sim' ? rel.estudos : '-'}</td>
            <td>${locked ? '<span class="badge badge-danger"><i class="fas fa-lock"></i> Trancado</span>' : '<span class="badge badge-success"><i class="fas fa-lock-open"></i> Editável</span>'}</td>
        `;
        tbody.appendChild(tr);
    });
}