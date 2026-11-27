// Справочник услуг автосервиса
const SERVICES = [
    { id: 1, title: 'Компьютерная диагностика двигателя', duration: 30, price: 1500 },
    { id: 2, title: 'Замена масла и фильтров (ТО-1)', duration: 60, price: 2800 },
    { id: 3, title: 'Диагностика и ремонт ходовой части', duration: 120, price: 4500 },
    { id: 4, title: 'Шиномонтаж и балансировка (4 колеса)', duration: 60, price: 2400 },
    { id: 5, title: 'Развал-схождение 3D', duration: 60, price: 2200 },
    { id: 6, title: 'Заправка и диагностика автокондиционера', duration: 60, price: 2500 }
];

// Справочник мастеров и постов
const MASTERS = [
    { id: 1, name: 'Пост №1 — Соколов А.В. (Автомеханик)' },
    { id: 2, name: 'Пост №2 — Морозов Д.И. (Диагност-электрик)' },
    { id: 3, name: 'Пост №3 — Волков С.Н. (Шиномонтаж / Развал)' }
];

// Рабочие часы автосервиса (09:00 - 19:00)
const WORK_START_MIN = 9 * 60;
const WORK_END_MIN = 19 * 60;
const SLOT_STEP_MIN = 30;

const STORAGE_KEY = 'autopro_bookings_v1';

// Инициализация демо-данных
function getBookings() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    const today = new Date().toISOString().split('T')[0];
    const demo = [
        {
            id: 101,
            serviceId: 2,
            masterId: 1,
            date: today,
            startMin: 10 * 60, // 10:00
            endMin: 11 * 60,   // 11:00
            clientName: 'Петров Алексей Сергеевич',
            clientPhone: '+7 (904) 555-12-34',
            carModel: 'Hyundai Solaris',
            carPlate: 'К452МН 174',
            comment: 'Масло своё, фильтр ваш',
            status: 'active'
        },
        {
            id: 102,
            serviceId: 3,
            masterId: 1,
            date: today,
            startMin: 13 * 60, // 13:00
            endMin: 15 * 60,   // 15:00
            clientName: 'Смирнова Елена Викторовна',
            clientPhone: '+7 (919) 888-77-66',
            carModel: 'Volkswagen Polo',
            carPlate: 'О777ОО 174',
            comment: 'Стук справа на кочках',
            status: 'done'
        }
    ];
    saveBookings(demo);
    return demo;
}

function saveBookings(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function minToTime(totalMin) {
    const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const m = String(totalMin % 60).padStart(2, '0');
    return `${h}:${m}`;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
}

// Заполнение выпадающих списков
function initSelectors() {
    const serviceSelect = document.getElementById('serviceSelect');
    const masterSelect = document.getElementById('masterSelect');
    const dateInput = document.getElementById('dateInput');

    SERVICES.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.title} — ${s.price} ₽ (${s.duration} мин)`;
        serviceSelect.appendChild(opt);
    });

    MASTERS.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        masterSelect.appendChild(opt);
    });

    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;

    updateServiceMeta();
    renderSlots();
}

function updateServiceMeta() {
    const serviceId = Number(document.getElementById('serviceSelect').value);
    const service = SERVICES.find(s => s.id === serviceId);
    if (service) {
        document.getElementById('serviceMeta').textContent =
            `Длительность работ: ${service.duration} мин | Стоимость: ${service.price} ₽`;
    }
}

// Генерация свободных и занятых слотов с учётом длительности услуги
function renderSlots() {
    const serviceId = Number(document.getElementById('serviceSelect').value);
    const masterId = Number(document.getElementById('masterSelect').value);
    const date = document.getElementById('dateInput').value;
    const container = document.getElementById('slotsContainer');
    const hiddenInput = document.getElementById('selectedTime');

    hiddenInput.value = '';
    container.innerHTML = '';

    if (!serviceId || !masterId || !date) return;

    const service = SERVICES.find(s => s.id === serviceId);
    const bookings = getBookings().filter(
        b => b.masterId === masterId && b.date === date && b.status !== 'cancelled'
    );

    for (let t = WORK_START_MIN; t + service.duration <= WORK_END_MIN; t += SLOT_STEP_MIN) {
        const slotStart = t;
        const slotEnd = t + service.duration;

        // Проверка пересечения интервалов
        const isBusy = bookings.some(b => slotStart < b.endMin && slotEnd > b.startMin);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slot-btn';
        btn.textContent = minToTime(slotStart);
        btn.disabled = isBusy;

        if (!isBusy) {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.slot-btn').forEach(el => el.classList.remove('selected'));
                btn.classList.add('selected');
                hiddenInput.value = slotStart;
            });
        }

        container.appendChild(btn);
    }
}

// Обработка формы записи
document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const startMinVal = document.getElementById('selectedTime').value;
    if (!startMinVal) {
        showToast('Ошибка: выберите свободный временной слот!');
        return;
    }

    const serviceId = Number(document.getElementById('serviceSelect').value);
    const masterId = Number(document.getElementById('masterSelect').value);
    const date = document.getElementById('dateInput').value;
    const startMin = Number(startMinVal);
    const service = SERVICES.find(s => s.id === serviceId);
    const endMin = startMin + service.duration;

    // Повторная проверка перед сохранением (защита от двойной записи)
    const bookings = getBookings();
    const conflict = bookings.some(
        b => b.masterId === masterId &&
             b.date === date &&
             b.status !== 'cancelled' &&
             startMin < b.endMin &&
             endMin > b.startMin
    );

    if (conflict) {
        showToast('Это время только что заняли! Выберите другой слот.');
        renderSlots();
        return;
    }

    const newBooking = {
        id: bookings.length ? Math.max(...bookings.map(b => b.id)) + 1 : 101,
        serviceId,
        masterId,
        date,
        startMin,
        endMin,
        clientName: document.getElementById('clientName').value.trim(),
        clientPhone: document.getElementById('clientPhone').value.trim(),
        carModel: document.getElementById('carModel').value.trim(),
        carPlate: document.getElementById('carPlate').value.trim().toUpperCase(),
        comment: document.getElementById('commentInput').value.trim(),
        status: 'active'
    };

    bookings.push(newBooking);
    saveBookings(bookings);

    showToast(`Запись №${newBooking.id} подтверждена на ${date} в ${minToTime(startMin)}!`);
    document.getElementById('searchClientInput').value = newBooking.carPlate;
    searchClientBookings();
    renderSlots();
    renderAdminPanel();
});

// Поиск записей клиента
function searchClientBookings() {
    const query = document.getElementById('searchClientInput').value.trim().toLowerCase();
    const listEl = document.getElementById('clientBookingsList');
    const bookings = getBookings();

    const filtered = query
        ? bookings.filter(b => b.carPlate.toLowerCase().includes(query) || b.clientPhone.toLowerCase().includes(query))
        : bookings.slice(-3).reverse();

    if (!filtered.length) {
        listEl.innerHTML = '<p class="empty-state">Записи по указанным данным не найдены.</p>';
        return;
    }

    listEl.innerHTML = filtered.map(b => {
        const srv = SERVICES.find(s => s.id === b.serviceId);
        const mst = MASTERS.find(m => m.id === b.masterId);
        const statusText = b.status === 'active' ? 'Подтверждена' : b.status === 'done' ? 'Выполнена' : 'Отменена';
        return `
            <div class="booking-item">
                <div class="booking-item-header">
                    <span>Запись #${b.id} — ${b.date} (${minToTime(b.startMin)}–${minToTime(b.endMin)})</span>
                    <span>${statusText}</span>
                </div>
                <div><b>Услуга:</b> ${srv.title} (${srv.price} ₽)</div>
                <div><b>Авто:</b> ${b.carModel} [${b.carPlate}]</div>
                <div><b>Мастер:</b> ${mst.name}</div>
            </div>
        `;
    }).join('');
}

// Панель администратора
function renderAdminPanel() {
    const bookings = getBookings();
    const filterDate = document.getElementById('adminFilterDate').value;

    // Статистика
    const activeCount = bookings.filter(b => b.status === 'active').length;
    const doneCount = bookings.filter(b => b.status === 'done').length;
    const totalRevenue = bookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (SERVICES.find(s => s.id === b.serviceId)?.price || 0), 0);

    document.getElementById('adminStats').innerHTML = `
        <div class="stat-card"><span>Всего заявок</span><strong>${bookings.length}</strong></div>
        <div class="stat-card"><span>Ожидают визита</span><strong>${activeCount}</strong></div>
        <div class="stat-card"><span>Выполнено работ</span><strong>${doneCount}</strong></div>
        <div class="stat-card"><span>Плановая выручка</span><strong>${totalRevenue.toLocaleString('ru-RU')} ₽</strong></div>
    `;

    const filtered = filterDate ? bookings.filter(b => b.date === filterDate) : bookings;
    const tbody = document.getElementById('adminTableBody');

    tbody.innerHTML = filtered.sort((a, b) => b.id - a.id).map(b => {
        const srv = SERVICES.find(s => s.id === b.serviceId);
        const mst = MASTERS.find(m => m.id === b.masterId);
        const badgeClass = b.status === 'active' ? 'badge-new' : b.status === 'done' ? 'badge-done' : 'badge-cancel';
        const badgeLabel = b.status === 'active' ? 'Записан' : b.status === 'done' ? 'Выполнено' : 'Отменено';

        return `
            <tr>
                <td>#${b.id}</td>
                <td><b>${b.date}</b><br>${minToTime(b.startMin)} – ${minToTime(b.endMin)}</td>
                <td>${mst.name}</td>
                <td>${srv.title}<br><b>${srv.price} ₽</b></td>
                <td>${b.clientName}<br><small>${b.clientPhone}</small></td>
                <td>${b.carModel}<br><b>${b.carPlate}</b></td>
                <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
                <td>
                    ${b.status === 'active' ? `
                        <button class="btn btn-primary btn-sm" onclick="changeStatus(${b.id}, 'done')">✓</button>
                        <button class="btn btn-secondary btn-sm" onclick="changeStatus(${b.id}, 'cancelled')">✕</button>
                    ` : '—'}
                </td>
            </tr>
        `;
    }).join('');
}

window.changeStatus = function(id, newStatus) {
    const bookings = getBookings();
    const item = bookings.find(b => b.id === id);
    if (item) {
        item.status = newStatus;
        saveBookings(bookings);
        renderAdminPanel();
        renderSlots();
        searchClientBookings();
        showToast(`Статус записи #${id} обновлён`);
    }
};

// Переключение вкладок
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// Слушатели событий
document.getElementById('serviceSelect').addEventListener('change', () => {
    updateServiceMeta();
    renderSlots();
});
document.getElementById('masterSelect').addEventListener('change', renderSlots);
document.getElementById('dateInput').addEventListener('change', renderSlots);
document.getElementById('searchClientBtn').addEventListener('click', searchClientBookings);
document.getElementById('adminFilterDate').addEventListener('change', renderAdminPanel);
document.getElementById('resetFilterBtn').addEventListener('click', () => {
    document.getElementById('adminFilterDate').value = '';
    renderAdminPanel();
});
document.getElementById('seedDemoBtn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    getBookings();
    renderAdminPanel();
    renderSlots();
    searchClientBookings();
    showToast('Демо-база восстановлена');
});

// Запуск
initSelectors();
searchClientBookings();
renderAdminPanel();
