// =============== UTILITY FUNCTIONS ===============

const MESES = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Get/Set localStorage with JSON
function getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function setData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Get all admins
function getAdmins() {
    return getData('admins') || [];
}

function saveAdmins(admins) {
    setData('admins', admins);
}

// Get all publicadores
function getPublicadores() {
    return getData('publicadores') || [];
}

function savePublicadores(pubs) {
    setData('publicadores', pubs);
}

// Get all relatorios
function getRelatorios() {
    return getData('relatorios') || [];
}

function saveRelatorios(rels) {
    setData('relatorios', rels);
}

// Get locked months
function getLockedMonths() {
    return getData('lockedMonths') || [];
}

function saveLockedMonths(locks) {
    setData('lockedMonths', locks);
}

// Check if month is locked for a group
function isMonthLocked(grupo, mes, ano) {
    const locks = getLockedMonths();
    return locks.some(l => l.grupo === grupo && l.mes == mes && l.ano == ano);
}

// Show message
function showMsg(elementId, text, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = text;
    el.className = `message ${type}`;
    el.classList.remove('hidden');
    setTimeout(() => {
        el.classList.add('hidden');
    }, 4000);
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Normalize string for comparison
function normalizeStr(str) {
    return str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Logout
function logout() {
    localStorage.removeItem('currentSession');
    window.location.replace('index.html');
}

// Populate year selects
function populateYearSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentYear = new Date().getFullYear();
    select.innerHTML = '';
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === currentYear) opt.selected = true;
        select.appendChild(opt);
    }
}

// Set current month in select
function setCurrentMonth(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentMonth = new Date().getMonth() + 1;
    select.value = currentMonth;
}

// Open/Close modal
function abrirModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function fecharModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}