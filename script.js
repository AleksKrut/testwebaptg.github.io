// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Состояние приложения
const appState = {
    currentPage: 'main',
    history: [],
    currentClient: null,
    currentService: null,
    currentSubservice: null,
    actionType: null,
    selectedDate: null,
    selectedTime: null,
    appointmentData: {
        organization: '',
        contactPerson: '',
        phone: '',
        vehicleNumber: '',
        vehicleUnknown: false,
        comment: ''
    },
    records: JSON.parse(localStorage.getItem('work_records')) || [],
    currentCalendar: {
        year: new Date().getFullYear(),
        month: new Date().getMonth()
    },
    // Для сдачи работ
    selectedWorkType: null,
    pendingWorks: [],
    selectedWork: null,
    photos: [],
    // Для монтажа МТ
    mtInstallData: {
        vehicleBrand: '',
        vehicleModel: '',
        vehicleNumber: '',
        mtBrand: '',
        mtNumber: '',
        photoTypes: {
            simCard: false,
            mtId: false,
            mtLocation: false,
            fuseBoxSeal: false,
            mtSeal1: false,
            mtSeal2: false
        }
    },
    // Для редактирования
    selectedRecord: null
};

// DOM элементы
const elements = {
    backBtn: document.getElementById('back-btn'),
    pageTitle: document.getElementById('page-title'),
    appContent: document.getElementById('app-content'),
    mainMenu: document.getElementById('main-menu'),
    dynamicContent: document.getElementById('dynamic-content'),
    userAvatar: document.getElementById('user-avatar'),
    username: document.getElementById('username'),
    currentDate: document.getElementById('current-date'),
    recordCount: document.getElementById('record-count'),
    modalOverlay: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.getElementById('modal-close')
};

// Инициализация приложения
function initApp() {
    // Показать данные пользователя
    const user = tg.initDataUnsafe.user;
    if (user) {
        elements.username.textContent = `${user.first_name} ${user.last_name || ''}`;
        elements.userAvatar.innerHTML = `<i class="fas fa-user"></i>`;
    }

    // Установить текущую дату
    updateCurrentDate();

    // Обновить счетчик записей
    updateRecordCount();

    // Назначить обработчики событий
    setupEventListeners();

    // Настроить тему
    setupTheme();

    // Показать главное меню
    showMainMenu();
}

// Обновление текущей даты
function updateCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    elements.currentDate.textContent = now.toLocaleDateString('ru-RU', options);
}

// Обновление счетчика записей
function updateRecordCount() {
    const count = appState.records.length;
    elements.recordCount.textContent = `Записей: ${count}`;
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка "Назад"
    elements.backBtn.addEventListener('click', goBack);

    // Закрытие модального окна
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });

    // Обработка нажатий на пункты главного меню
    document.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            const action = menuItem.dataset.action;
            handleMenuAction(action);
        }
    });
}

// Настройка темы
function setupTheme() {
    const isDark = localStorage.getItem('theme') === 'dark' ||
                   (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

// Показать главное меню
function showMainMenu() {
    appState.currentPage = 'main';
    appState.history = [];

    elements.pageTitle.textContent = 'Главное меню';
    elements.backBtn.style.display = 'none';
    elements.mainMenu.style.display = 'flex';
    elements.dynamicContent.style.display = 'none';

    // Обновляем счетчик записей
    updateRecordCount();
}

// Обработка действий меню
function handleMenuAction(action) {
    switch(action) {
        case 'record-client':
            appState.actionType = 'record';
            showClientSelection();
            break;
        case 'complete-work':
            showServiceTypeSelection();
            break;
        case 'verification':
            showVerificationForm();
            break;
        case 'view-records':
            showRecords();
            break;
        case 'settings':
            showSettings();
            break;
    }
}

// Показать выбор клиента (для записи)
function showClientSelection() {
    appState.currentPage = 'client-selection';
    appState.history.push('main');

    // Сбросить выбранные данные
    appState.selectedDate = null;
    appState.selectedTime = null;
    appState.appointmentData = {
        organization: '',
        contactPerson: '',
        phone: '',
        vehicleNumber: '',
        vehicleUnknown: false,
        comment: ''
    };

    elements.pageTitle.textContent = 'Запись на работу';
    elements.backBtn.style.display = 'flex';
    elements.mainMenu.style.display = 'none';

    const clients = [
        { id: 'its', name: 'Клиент ИТС', icon: 'fas fa-building' },
        { id: 'skai', name: 'Клиент SKAI', icon: 'fas fa-industry' },
        { id: 'tt', name: 'Клиент ТТ', icon: 'fas fa-truck' },
        { id: 'citypoint', name: 'Клиент CityPoint', icon: 'fas fa-city' }
    ];

    let html = '<div class="submenu-container">';
    clients.forEach(client => {
        html += `
            <div class="submenu-item" data-client="${client.id}">
                <i class="${client.icon}"></i>
                <div class="submenu-text">
                    <h4>${client.name}</h4>
                    <p>Выбрать дату и время</p>
                </div>
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
    });
    html += '</div>';

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Добавить обработчики для выбора клиента
    document.querySelectorAll('.submenu-item[data-client]').forEach(item => {
        item.addEventListener('click', () => {
            const clientId = item.dataset.client;
            appState.currentClient = clientId;
            showCalendar();
        });
    });
}

// Показать календарь для выбора даты
function showCalendar() {
    appState.currentPage = 'calendar';
    appState.history.push('client-selection');

    const clientName = getClientName(appState.currentClient);
    elements.pageTitle.textContent = `Выберите дату - ${clientName}`;

    // Устанавливаем текущий месяц и год
    const today = new Date();
    appState.currentCalendar.year = today.getFullYear();
    appState.currentCalendar.month = today.getMonth();

    renderCalendar(appState.currentCalendar.year, appState.currentCalendar.month);
}

// Рендеринг календаря
function renderCalendar(year, month) {
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    let html = `
        <div class="calendar-container">
            <div class="calendar-header">
                <div class="calendar-month">${monthNames[month]} ${year}</div>
                <div class="calendar-nav">
                    <button class="calendar-nav-btn" id="prev-month">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="calendar-nav-btn" id="today-btn">
                        Сегодня
                    </button>
                    <button class="calendar-nav-btn" id="next-month">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            
            <div class="calendar-weekdays">
                <div class="calendar-weekday">Пн</div>
                <div class="calendar-weekday">Вт</div>
                <div class="calendar-weekday">Ср</div>
                <div class="calendar-weekday">Чт</div>
                <div class="calendar-weekday">Пт</div>
                <div class="calendar-weekday">Сб</div>
                <div class="calendar-weekday">Вс</div>
            </div>
            
            <div class="calendar-days" id="calendar-days">
    `;

    // Пустые клетки до первого дня месяца
    let firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7;

    for (let i = 1; i < firstDayOfWeek; i++) {
        html += '<div class="calendar-day disabled"></div>';
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isPast = date < today && !isToday;
        const isSelected = appState.selectedDate &&
                          date.toDateString() === appState.selectedDate.toDateString();

        let dayClass = 'calendar-day';
        if (isToday) dayClass += ' today';
        if (isPast) dayClass += ' past';
        if (isSelected) dayClass += ' selected';
        if (!isPast) dayClass += ' selectable';

        html += `<div class="${dayClass}" data-day="${day}" data-date="${date.toISOString().split('T')[0]}">${day}</div>`;
    }

    html += '</div></div>';

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Обработчики для навигации
    document.getElementById('prev-month').addEventListener('click', () => {
        const newMonth = month === 0 ? 11 : month - 1;
        const newYear = month === 0 ? year - 1 : year;
        appState.currentCalendar.year = newYear;
        appState.currentCalendar.month = newMonth;
        renderCalendar(newYear, newMonth);
    });

    document.getElementById('next-month').addEventListener('click', () => {
        const newMonth = month === 11 ? 0 : month + 1;
        const newYear = month === 11 ? year + 1 : year;
        appState.currentCalendar.year = newYear;
        appState.currentCalendar.month = newMonth;
        renderCalendar(newYear, newMonth);
    });

    document.getElementById('today-btn').addEventListener('click', () => {
        const today = new Date();
        appState.currentCalendar.year = today.getFullYear();
        appState.currentCalendar.month = today.getMonth();
        renderCalendar(today.getFullYear(), today.getMonth());
    });

    // Обработчики для выбора дня
    document.querySelectorAll('.calendar-day.selectable').forEach(dayElement => {
        dayElement.addEventListener('click', () => {
            const day = parseInt(dayElement.dataset.day);
            const dateStr = dayElement.dataset.date;
            appState.selectedDate = new Date(dateStr);

            // Показать выбор времени
            showTimeSelection();
        });
    });
}

// Показать выбор времени
function showTimeSelection() {
    appState.currentPage = 'time-selection';
    appState.history.push('calendar');

    const dateStr = appState.selectedDate.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    elements.pageTitle.textContent = `Выберите время - ${dateStr}`;

    // Генерация временных слотов с 9:00 до 18:00, интервал 10 минут
    const timeSlots = [];
    const startHour = 9;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 10) {
            // Пропускаем обеденное время (13:00 - 14:00)
            if (hour === 13 && minute >= 0 && minute < 60) {
                continue;
            }

            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeSlots.push(timeStr);
        }
    }

    let html = `
        <div class="time-slots-container">
            <p style="margin-bottom: 20px; color: var(--text-secondary);">
                Выберите удобное время (обед с 13:00 до 14:00)
            </p>
            
            <div class="time-slots-grid">
    `;

    // Добавляем временные слоты
    timeSlots.forEach(timeSlot => {
        const isSelected = appState.selectedTime === timeSlot;
        const timeClass = isSelected ? 'time-slot selected' : 'time-slot';

        html += `<div class="${timeClass}" data-time="${timeSlot}">${timeSlot}</div>`;
    });

    // Добавляем обеденный перерыв
    html += `
            <div class="lunch-break">🍽️ Обед 13:00 - 14:00</div>
        </div>
        
        <button class="btn btn-primary" id="confirm-time-btn" style="margin-top: 20px;" ${!appState.selectedTime ? 'disabled' : ''}>
            <i class="fas fa-check btn-icon"></i>
            Продолжить
        </button>
    </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Обработчики для выбора времени
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            // Снимаем выделение со всех слотов
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
            });

            // Выделяем выбранный слот
            slot.classList.add('selected');
            appState.selectedTime = slot.dataset.time;

            // Активируем кнопку продолжения
            document.getElementById('confirm-time-btn').disabled = false;
        });
    });

    // Обработчик кнопки продолжения
    document.getElementById('confirm-time-btn').addEventListener('click', () => {
        showAppointmentForm();
    });
}

// Показать форму записи
function showAppointmentForm() {
    appState.currentPage = 'appointment-form';
    appState.history.push('time-selection');

    const clientName = getClientName(appState.currentClient);
    const dateStr = appState.selectedDate.toLocaleDateString('ru-RU');

    elements.pageTitle.textContent = `Заполните данные - ${clientName}`;

    let html = `
        <div class="form-section">
            <div class="form-section-title">📅 Информация о записи</div>
            <div class="summary-item">
                <div class="summary-label">Клиент:</div>
                <div class="summary-value">${clientName}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Дата:</div>
                <div class="summary-value">${dateStr}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Время:</div>
                <div class="summary-value">${appState.selectedTime}</div>
            </div>
        </div>
        
        <div class="form-section">
            <div class="form-section-title">🏢 Данные организации</div>
            
            <div class="input-group">
                <label class="required">Организация</label>
                <input type="text" class="form-input" id="organization" 
                       placeholder="Введите название организации" 
                       value="${appState.appointmentData.organization}">
                <div class="error-message" id="organization-error">Пожалуйста, введите название организации</div>
            </div>
            
            <div class="input-group">
                <label class="required">Представитель</label>
                <input type="text" class="form-input" id="contact-person" 
                       placeholder="ФИО представителя" 
                       value="${appState.appointmentData.contactPerson}">
                <div class="error-message" id="contact-person-error">Пожалуйста, введите ФИО представителя</div>
            </div>
            
            <div class="input-group">
                <label class="required">Телефон</label>
                <input type="tel" class="form-input" id="phone" 
                       placeholder="+7 (999) 123-45-67" 
                       value="${appState.appointmentData.phone}">
                <div class="error-message" id="phone-error">Пожалуйста, введите корректный номер телефона</div>
            </div>
        </div>
        
        <div class="form-section">
            <div class="form-section-title">🚗 Данные транспортного средства</div>
            
            <div class="input-group">
                <label>Номер ТС</label>
                <input type="text" class="form-input" id="vehicle-number" 
                       placeholder="А123БВ777" 
                       value="${appState.appointmentData.vehicleNumber}"
                       ${appState.appointmentData.vehicleUnknown ? 'disabled' : ''}>
            </div>
            
            <div class="checkbox-group" style="margin-top: 15px;">
                <input type="checkbox" id="vehicle-unknown" ${appState.appointmentData.vehicleUnknown ? 'checked' : ''}>
                <label for="vehicle-unknown" style="margin-left: 8px; font-size: 14px;">
                    Номер ТС неизвестен
                </label>
            </div>
        </div>
        
        <div class="form-section">
            <div class="form-section-title">💬 Комментарий (необязательно)</div>
            
            <div class="input-group">
                <label>Комментарий</label>
                <textarea class="form-input" id="comment" 
                       placeholder="Дополнительная информация..." 
                       rows="3">${appState.appointmentData.comment}</textarea>
            </div>
        </div>
        
        <button class="btn btn-success" id="save-appointment-btn">
            <i class="fas fa-calendar-check btn-icon"></i>
            Сохранить запись
        </button>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Обработчик сохранения записи
    document.getElementById('save-appointment-btn').addEventListener('click', saveAppointment);

    // Обработчик чекбокса "Номер ТС неизвестен"
    document.getElementById('vehicle-unknown').addEventListener('change', function() {
        const vehicleNumberInput = document.getElementById('vehicle-number');
        if (this.checked) {
            vehicleNumberInput.disabled = true;
            vehicleNumberInput.value = '';
            vehicleNumberInput.placeholder = 'Неизвестен';
        } else {
            vehicleNumberInput.disabled = false;
            vehicleNumberInput.placeholder = 'А123БВ777';
        }
    });

    // Валидация полей в реальном времени
    document.getElementById('organization').addEventListener('input', validateForm);
    document.getElementById('contact-person').addEventListener('input', validateForm);
    document.getElementById('phone').addEventListener('input', validateForm);
}

// Валидация формы
function validateForm() {
    const organization = document.getElementById('organization').value.trim();
    const contactPerson = document.getElementById('contact-person').value.trim();
    const phone = document.getElementById('phone').value.trim();

    let isValid = true;

    // Валидация организации
    if (!organization) {
        document.getElementById('organization-error').style.display = 'block';
        document.getElementById('organization').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('organization-error').style.display = 'none';
        document.getElementById('organization').classList.remove('error');
    }

    // Валидация представителя
    if (!contactPerson) {
        document.getElementById('contact-person-error').style.display = 'block';
        document.getElementById('contact-person').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('contact-person-error').style.display = 'none';
        document.getElementById('contact-person').classList.remove('error');
    }

    // Валидация телефона
    const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    if (!phone || !phoneRegex.test(phone.replace(/\D/g, ''))) {
        document.getElementById('phone-error').style.display = 'block';
        document.getElementById('phone').classList.add('error');
        isValid = false;
    } else:
        document.getElementById('phone-error').style.display = 'none';
        document.getElementById('phone').classList.remove('error');
    }

    return isValid;
}

// Сохранение записи
function saveAppointment() {
    if (!validateForm()) {
        tg.showAlert('Пожалуйста, заполните все обязательные поля корректно');
        return;
    }

    // Сохраняем данные формы
    appState.appointmentData = {
        organization: document.getElementById('organization').value.trim(),
        contactPerson: document.getElementById('contact-person').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        vehicleNumber: document.getElementById('vehicle-number').value.trim(),
        vehicleUnknown: document.getElementById('vehicle-unknown').checked,
        comment: document.getElementById('comment').value.trim()
    };

    // Создаем запись для локального хранения
    const record = {
        id: Date.now(),
        client: appState.currentClient,
        service: 'appointment',
        date: appState.selectedDate.toISOString().split('T')[0],
        time: appState.selectedTime,
        organization: appState.appointmentData.organization,
        contactPerson: appState.appointmentData.contactPerson,
        phone: appState.appointmentData.phone,
        vehicleNumber: appState.appointmentData.vehicleNumber,
        vehicleUnknown: appState.appointmentData.vehicleUnknown,
        comment: appState.appointmentData.comment,
        status: 'pending',
        type: 'record',
        work_type: 'record',
        createdAt: new Date().toISOString(),
        createdBy: tg.initDataUnsafe.user?.id || 'unknown'
    };

    // Сохраняем в localStorage
    appState.records.unshift(record);
    localStorage.setItem('work_records', JSON.stringify(appState.records));

    // Отправляем в бот
    sendToBot(record);

    // Показываем подтверждение
    showConfirmation(record);
}

// Отправка данных в бот
function sendToBot(record) {
    try {
        const data = {
            action: 'save_appointment',
            client: record.client,
            date: record.date,
            time: record.time,
            organization: record.organization,
            contact_person: record.contactPerson,
            phone: record.phone,
            car_number: record.vehicleNumber,
            car_unknown: record.vehicleUnknown,
            comment: record.comment
        };

        // Отправляем данные через Telegram WebApp
        tg.sendData(JSON.stringify(data));

        console.log('Данные отправлены в бот:', data);
    } catch (error) {
        console.error('Ошибка отправки данных в бот:', error);
        // Сохраняем для последующей отправки
        const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
        pending.push(data);
        localStorage.setItem('pending_submissions', JSON.stringify(pending));
    }
}

// Добавить функцию для отправки отложенных данных
async function sendPendingSubmissions() {
    const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
    if (pending.length === 0) return;

    for (const data of pending) {
        try {
            tg.sendData(JSON.stringify(data));
            console.log('Отправлен отложенный запрос:', data);
        } catch (error) {
            console.error('Ошибка отправки отложенного запроса:', error);
        }
    }

    // Очищаем отложенные запросы после отправки
    localStorage.removeItem('pending_submissions');
}

// Показать подтверждение
function showConfirmation(record) {
    const dateStr = new Date(record.date).toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    showModal('✅ Запись сохранена!', `
        <div style="text-align: center;">
            <i class="fas fa-check-circle" style="font-size: 48px; color: var(--success-color); margin-bottom: 20px;"></i>
            <h3 style="margin-bottom: 15px;">Запись успешно создана</h3>
            
            <div style="background: var(--light-bg); padding: 15px; border-radius: 10px; text-align: left; margin-bottom: 20px;">
                <p><strong>Клиент:</strong> ${getClientName(record.client)}</p>
                <p><strong>Организация:</strong> ${record.organization}</p>
                <p><strong>Представитель:</strong> ${record.contactPerson}</p>
                <p><strong>Телефон:</strong> ${record.phone}</p>
                <p><strong>Дата и время:</strong> ${dateStr} в ${record.time}</p>
                ${record.vehicleUnknown ? `<p><strong>Номер ТС:</strong> Неизвестен (галочка установлена)</p>` : ''}
                ${!record.vehicleUnknown && record.vehicleNumber ? `<p><strong>Номер ТС:</strong> ${record.vehicleNumber}</p>` : ''}
                ${record.comment ? `<p><strong>Комментарий:</strong> ${record.comment}</p>` : ''}
            </div>
            
            <p style="color: var(--text-secondary);">
                Запись отправлена менеджерам.
            </p>
        </div>
    `);

    // Обновляем счетчик записей
    updateRecordCount();

    // Возвращаемся на главную через 3 секунды
    setTimeout(() => {
        closeModal();
        showMainMenu();
    }, 3000);
}

// Показать выбор типа работы для сдачи
function showServiceTypeSelection() {
    appState.currentPage = 'service-type-selection';
    appState.history.push('main');

    // Сбросить выбранные данные
    appState.selectedWorkType = null;
    appState.pendingWorks = [];
    appState.selectedWork = null;
    appState.photos = [];
    // Сбросить данные монтажа МТ
    appState.mtInstallData = {
        vehicleBrand: '',
        vehicleModel: '',
        vehicleNumber: '',
        mtBrand: '',
        mtNumber: '',
        photoTypes: {
            simCard: false,
            mtId: false,
            mtLocation: false,
            fuseBoxSeal: false,
            mtSeal1: false,
            mtSeal2: false
        }
    };

    elements.pageTitle.textContent = 'Сдать работу';
    elements.backBtn.style.display = 'flex';
    elements.mainMenu.style.display = 'none';

    const serviceTypes = [
        {
            id: 'mt_install',
            name: 'Монтаж МТ',
            icon: 'fas fa-wrench',
            description: 'Работы по монтажу мониторинга транспорта',
            colorClass: 'service-type-mt'
        },
        {
            id: 'asn_install',
            name: 'Монтаж АСН',
            icon: 'fas fa-satellite-dish',
            description: 'Работы по монтажу системы навигации',
            colorClass: 'service-type-asn'
        },
        {
            id: 'taho_install',
            name: 'Монтаж ТАХО',
            icon: 'fas fa-tachometer-alt',
            description: 'Работы по установке тахографов',
            colorClass: 'service-type-taho'
        },
        {
            id: 'diagnostic',
            name: 'Диагностика',
            icon: 'fas fa-stethoscope',
            description: 'Диагностические работы любой техники',
            colorClass: 'service-type-diagnostic'
        }
    ];

    let html = `
        <div class="service-type-container">
            <p style="margin-bottom: 20px; color: var(--text-secondary);">
                Выберите тип работы, которую хотите сдать:
            </p>
            
            <div class="service-type-grid">
    `;

    serviceTypes.forEach(service => {
        const isSelected = appState.selectedWorkType === service.id;
        const itemClass = isSelected ? 'service-type-item selected' : 'service-type-item';

        html += `
            <div class="${itemClass}" data-service="${service.id}">
                <div class="service-type-icon ${service.colorClass}">
                    <i class="${service.icon}"></i>
                </div>
                <div class="service-type-name">${service.name}</div>
                <div class="service-type-desc">${service.description}</div>
            </div>
        `;
    });

    html += `
            </div>
            
            <button class="btn btn-primary" id="select-service-btn" style="margin-top: 20px;" disabled>
                <i class="fas fa-arrow-right btn-icon"></i>
                Далее
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Обработчики для выбора типа работы
    document.querySelectorAll('.service-type-item').forEach(item => {
        item.addEventListener('click', () => {
            // Снимаем выделение со всех элементов
            document.querySelectorAll('.service-type-item').forEach(el => {
                el.classList.remove('selected');
            });

            // Выделяем выбранный элемент
            item.classList.add('selected');
            appState.selectedWorkType = item.dataset.service;

            // Активируем кнопку продолжения
            document.getElementById('select-service-btn').disabled = false;
        });
    });

    // Обработчик кнопки продолжения
    document.getElementById('select-service-btn').addEventListener('click', () => {
        loadPendingWorks();
    });
}

// Загрузка работ, ожидающих сдачи
async function loadPendingWorks() {
    showLoading('Загрузка списка работ...');

    try {
        // Отправляем запрос в бот для получения работ
        const data = {
            action: 'get_pending_works',
            service_type: appState.selectedWorkType
        };

        tg.sendData(JSON.stringify(data));

        // Загружаем локальные записи как запасной вариант
        const pendingWorks = appState.records.filter(record =>
            record.service === appState.selectedWorkType &&
            record.status === 'pending'
        );

        appState.pendingWorks = pendingWorks;

        hideLoading();

        if (pendingWorks.length === 0) {
            showModal(
                'Нет работ для сдачи',
                `По типу работы "${getServiceDisplayName(appState.selectedWorkType)}" нет работ, ожидающих фотоотчета.<br><br>
                 Создайте новые записи через меню "Записать клиента".`
            );
            setTimeout(() => {
                closeModal();
                showServiceTypeSelection();
            }, 3000);
            return;
        }

        showWorkList();

    } catch (error) {
        hideLoading();
        console.error('Error loading pending works:', error);
        tg.showAlert('Ошибка при загрузке списка работ');
    }
}

// Показать список работ для выбора
function showWorkList() {
    appState.currentPage = 'work-list';
    appState.history.push('service-type-selection');

    const serviceName = getServiceDisplayName(appState.selectedWorkType);
    elements.pageTitle.textContent = `Выберите работу - ${serviceName}`;

    let html = `
        <div class="work-list-container">
            <p style="margin-bottom: 20px; color: var(--text-secondary);">
                Выберите работу для прикрепления фотоотчета:
            </p>
            
            <div id="works-list">
    `;

    if (appState.pendingWorks.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-clipboard-list" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">Нет работ для сдачи</h3>
                <p style="color: var(--text-secondary);">Создайте новые записи через меню "Записать клиента"</p>
            </div>
        `;
    } else {
        appState.pendingWorks.forEach((work, index) => {
            const isSelected = appState.selectedWork && appState.selectedWork.id === work.id;
            const workClass = isSelected ? 'work-item selected' : 'work-item';
            const dateStr = new Date(work.date).toLocaleDateString('ru-RU');

            html += `
                <div class="${workClass}" data-work-id="${work.id}">
                    <div class="work-header">
                        <div class="work-client">${getClientName(work.client)}</div>
                        <div class="work-date">${dateStr} ${work.time}</div>
                    </div>
                    
                    ${work.organization ? `
                        <div class="work-details">
                            <i class="fas fa-building"></i> ${work.organization}
                        </div>
                    ` : ''}
                    
                    ${work.contactPerson ? `
                        <div class="work-details">
                            <i class="fas fa-user"></i> ${work.contactPerson}
                        </div>
                    ` : ''}
                    
                    ${work.phone ? `
                        <div class="work-details">
                            <i class="fas fa-phone"></i> ${work.phone}
                        </div>
                    ` : ''}
                    
                    ${work.vehicleUnknown ? `
                        <div class="work-details">
                            <i class="fas fa-car"></i> Номер ТС неизвестен
                        </div>
                    ` : ''}
                    
                    ${!work.vehicleUnknown && work.vehicleNumber ? `
                        <div class="work-details">
                            <i class="fas fa-car"></i> ${work.vehicleNumber}
                        </div>
                    ` : ''}
                    
                    ${work.comment ? `
                        <div class="work-details">
                            <i class="fas fa-comment"></i> ${work.comment.substring(0, 50)}...
                        </div>
                    ` : ''}
                    
                    <div class="work-status status-pending">Ожидает фотоотчета</div>
                </div>
            `;
        });
    }

    html += `
            </div>
            
            <button class="btn btn-primary" id="select-work-btn" style="margin-top: 20px;" ${!appState.selectedWork ? 'disabled' : ''}>
                <i class="fas fa-camera btn-icon"></i>
                Прикрепить фотоотчет
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Обработчики для выбора работы
    document.querySelectorAll('.work-item').forEach(item => {
        item.addEventListener('click', () => {
            const workId = parseInt(item.dataset.workId);

            // Снимаем выделение со всех работ
            document.querySelectorAll('.work-item').forEach(el => {
                el.classList.remove('selected');
            });

            // Выделяем выбранную работу
            item.classList.add('selected');

            // Находим выбранную работу
            appState.selectedWork = appState.pendingWorks.find(work => work.id === workId);

            // Активируем кнопку продолжения
            document.getElementById('select-work-btn').disabled = false;
        });
    });

    // Обработчик кнопки продолжения
    document.getElementById('select-work-btn').addEventListener('click', () => {
        // Для монтажа МТ показываем специальную форму
        if (appState.selectedWorkType === 'mt_install') {
            showMtInstallForm();
        } else {
            showPhotoUpload();
        }
    });
}

// Показать форму монтажа МТ
function showMtInstallForm() {
    appState.currentPage = 'mt-install-form';
    appState.history.push('work-list');

    const clientName = getClientName(appState.selectedWork.client);
    elements.pageTitle.textContent = `Монтаж МТ - ${clientName}`;

    // Используем номер ТС из записи, если он есть
    const vehicleNumber = appState.selectedWork.vehicleNumber && !appState.selectedWork.vehicleUnknown
        ? appState.selectedWork.vehicleNumber
        : '';

    let html = `
        <div class="mt-install-form-container">
            <div class="form-section">
                <div class="form-section-title">📋 Выберите, что будете фотографировать</div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-sim-card" ${appState.mtInstallData.photoTypes.simCard ? 'checked' : ''}>
                    <label for="photo-sim-card">Сим карта</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-mt-id" ${appState.mtInstallData.photoTypes.mtId ? 'checked' : ''}>
                    <label for="photo-mt-id">ID МТ</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-mt-location" ${appState.mtInstallData.photoTypes.mtLocation ? 'checked' : ''}>
                    <label for="photo-mt-location">Место установки МТ</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-fuse-box-seal" ${appState.mtInstallData.photoTypes.fuseBoxSeal ? 'checked' : ''}>
                    <label for="photo-fuse-box-seal">Пломбка колодки предохранителей</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-mt-seal-1" ${appState.mtInstallData.photoTypes.mtSeal1 ? 'checked' : ''}>
                    <label for="photo-mt-seal-1">Пломба МТ 1</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-mt-seal-2" ${appState.mtInstallData.photoTypes.mtSeal2 ? 'checked' : ''}>
                    <label for="photo-mt-seal-2">Пломба МТ 2</label>
                </div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">🚗 Данные транспортного средства</div>
                
                <div class="input-group">
                    <label>Марка/модель ТС</label>
                    <input type="text" class="form-input" id="vehicle-brand-model" 
                           placeholder="Например: ГАЗель NEXT" 
                           value="${appState.mtInstallData.vehicleBrand} ${appState.mtInstallData.vehicleModel}">
                </div>
                
                <div class="input-group">
                    <label>Гос. номер ТС</label>
                    <input type="text" class="form-input" id="vehicle-number" 
                           placeholder="А123БВ777" 
                           value="${vehicleNumber || appState.mtInstallData.vehicleNumber}">
                    <p class="form-hint">Укажите, если не был указан при создании заявки</p>
                </div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">📱 Данные МТ</div>
                
                <div class="input-group">
                    <label>Марка МТ</label>
                    <input type="text" class="form-input" id="mt-brand" 
                           placeholder="Например: Galileosky" 
                           value="${appState.mtInstallData.mtBrand}">
                </div>
                
                <div class="input-group">
                    <label>Номер МТ</label>
                    <input type="text" class="form-input" id="mt-number" 
                           placeholder="Уникальный номер устройства" 
                           value="${appState.mtInstallData.mtNumber}">
                </div>
            </div>
            
            <button class="btn btn-primary" id="continue-to-photos-btn">
                <i class="fas fa-arrow-right btn-icon"></i>
                Перейти к загрузке фото
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Обработчик кнопки продолжения
    document.getElementById('continue-to-photos-btn').addEventListener('click', () => {
        // Сохраняем данные формы
        const brandModel = document.getElementById('vehicle-brand-model').value.trim();
        const [brand, ...modelParts] = brandModel.split(' ');

        appState.mtInstallData = {
            vehicleBrand: brand || '',
            vehicleModel: modelParts.join(' ') || '',
            vehicleNumber: document.getElementById('vehicle-number').value.trim(),
            mtBrand: document.getElementById('mt-brand').value.trim(),
            mtNumber: document.getElementById('mt-number').value.trim(),
            photoTypes: {
                simCard: document.getElementById('photo-sim-card').checked,
                mtId: document.getElementById('photo-mt-id').checked,
                mtLocation: document.getElementById('photo-mt-location').checked,
                fuseBoxSeal: document.getElementById('photo-fuse-box-seal').checked,
                mtSeal1: document.getElementById('photo-mt-seal-1').checked,
                mtSeal2: document.getElementById('photo-mt-seal-2').checked
            }
        };

        // Проверяем обязательные поля
        if (!appState.mtInstallData.vehicleBrand || !appState.mtInstallData.mtBrand || !appState.mtInstallData.mtNumber) {
            tg.showAlert('Пожалуйста, заполните все обязательные поля: Марка/модель ТС, Марка МТ, Номер МТ');
            return;
        }

        // Проверяем, что выбрана хотя бы одна фотография
        const hasSelectedPhotos = Object.values(appState.mtInstallData.photoTypes).some(value => value);
        if (!hasSelectedPhotos) {
            tg.showAlert('Пожалуйста, выберите хотя бы один пункт для фотографирования');
            return;
        }

        // Переходим к загрузке фото
        showMtPhotoUpload();
    });
}

// Показать форму загрузки фото для монтажа МТ
function showMtPhotoUpload() {
    appState.currentPage = 'mt-photo-upload';
    appState.history.push('mt-install-form');

    const clientName = getClientName(appState.selectedWork.client);
    elements.pageTitle.textContent = `Фотоотчет МТ - ${clientName}`;

    // Собираем список выбранных фотографий
    const selectedPhotos = [];
    if (appState.mtInstallData.photoTypes.simCard) selectedPhotos.push('Сим карта');
    if (appState.mtInstallData.photoTypes.mtId) selectedPhotos.push('ID МТ');
    if (appState.mtInstallData.photoTypes.mtLocation) selectedPhotos.push('Место установки МТ');
    if (appState.mtInstallData.photoTypes.fuseBoxSeal) selectedPhotos.push('Пломбка колодки предохранителей');
    if (appState.mtInstallData.photoTypes.mtSeal1) selectedPhotos.push('Пломба МТ 1');
    if (appState.mtInstallData.photoTypes.mtSeal2) selectedPhotos.push('Пломба МТ 2');

    let html = `
        <div class="photo-upload-container">
            <div class="summary-item">
                <div class="summary-label">Тип работы:</div>
                <div class="summary-value">Монтаж МТ</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Клиент:</div>
                <div class="summary-value">${clientName}</div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">📋 Данные монтажа</div>
                <div class="summary-item">
                    <div class="summary-label">Марка/модель ТС:</div>
                    <div class="summary-value">${appState.mtInstallData.vehicleBrand} ${appState.mtInstallData.vehicleModel}</div>
                </div>
                ${appState.mtInstallData.vehicleNumber ? `
                <div class="summary-item">
                    <div class="summary-label">Гос. номер:</div>
                    <div class="summary-value">${appState.mtInstallData.vehicleNumber}</div>
                </div>
                ` : ''}
                <div class="summary-item">
                    <div class="summary-label">Марка МТ:</div>
                    <div class="summary-value">${appState.mtInstallData.mtBrand}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Номер МТ:</div>
                    <div class="summary-value">${appState.mtInstallData.mtNumber}</div>
                </div>
            </div>
            
            <div style="margin: 20px 0; border-top: 1px solid var(--border-color); padding-top: 20px;">
                <h4 style="margin-bottom: 15px; color: var(--primary-color);">
                    <i class="fas fa-camera"></i> Загрузка фотографий
                </h4>
                
                <p style="color: var(--text-secondary); margin-bottom: 15px;">
                    Вы выбрали для фотографирования: <strong>${selectedPhotos.join(', ')}</strong>
                </p>
                
                <p style="color: var(--text-secondary); margin-bottom: 15px;">
                    Загрузите фотографии для выбранных пунктов (максимум 10 фото):
                </p>
                
                <div class="photo-preview-container" id="photo-preview-container">
                    <div class="add-photo-btn" id="add-photo-btn">
                        <i class="fas fa-plus"></i>
                        <span>Добавить фото</span>
                        <input type="file" id="photo-input" accept="image/*" multiple style="display: none;">
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label>Комментарий к фотоотчету (необязательно)</label>
                    <textarea class="form-control" id="photo-comment" placeholder="Дополнительная информация..." rows="3"></textarea>
                </div>
            </div>
            
            <button class="btn btn-success" id="submit-mt-photo-report-btn" ${appState.photos.length === 0 ? 'disabled' : ''}>
                <i class="fas fa-paper-plane btn-icon"></i>
                Отправить фотоотчет
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Инициализация загрузки фото
    initPhotoUpload();

    // Обработчик отправки фотоотчета
    document.getElementById('submit-mt-photo-report-btn').addEventListener('click', submitMtPhotoReport);
}

// Отправка фотоотчета для монтажа МТ
async function submitMtPhotoReport() {
    if (appState.photos.length === 0) {
        tg.showAlert('Добавьте хотя бы одно фото');
        return;
    }

    showLoading('Отправка фотоотчета...');

    try {
        // Конвертируем фото в base64
        const photoPromises = appState.photos.map(photo => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Убираем префикс data:image/jpeg;base64,
                    const base64Data = e.target.result.split(',')[1];
                    resolve(base64Data);
                };
                reader.readAsDataURL(photo.file);
            });
        });

        const photosBase64 = await Promise.all(photoPromises);

        // Подготавливаем данные для отправки
        const reportData = {
            action: 'submit_mt_install_report',
            record_id: appState.selectedWork.id,
            service_type: 'mt_install',
            photos: photosBase64,
            mt_install_data: appState.mtInstallData,
            comment: document.getElementById('photo-comment')?.value.trim() || ''
        };

        // Отправляем данные в бот
        tg.sendData(JSON.stringify(reportData));

        hideLoading();

        // Показываем подтверждение
        showModal(
            '✅ Фотоотчет отправлен!',
            `Фотоотчет по монтажу МТ успешно отправлен в рабочий чат.<br><br>
             📸 Отправлено фото: ${appState.photos.length}<br>
             🚗 ТС: ${appState.mtInstallData.vehicleBrand} ${appState.mtInstallData.vehicleModel}<br>
             📱 МТ: ${appState.mtInstallData.mtBrand} №${appState.mtInstallData.mtNumber}<br><br>
             Фото будут проверены менеджером.`
        );

        // Обновляем статус работы локально
        const workIndex = appState.records.findIndex(r => r.id === appState.selectedWork.id);
        if (workIndex !== -1) {
            appState.records[workIndex].status = 'completed';
            appState.records[workIndex].photo_reports = appState.photos.length;
            appState.records[workIndex].photo_reports_data = appState.photos;
            appState.records[workIndex].mt_install_data = appState.mtInstallData;
            localStorage.setItem('work_records', JSON.stringify(appState.records));
            updateRecordCount();
        }

        // Возвращаемся на главную через 3 секунды
        setTimeout(() => {
            closeModal();
            showMainMenu();
        }, 3000);

    } catch (error) {
        hideLoading();
        console.error('Error submitting MT photo report:', error);
        tg.showAlert('Ошибка при отправке фотоотчета');
    }
}

// Показать форму загрузки фото (для других типов работ)
function showPhotoUpload() {
    appState.currentPage = 'photo-upload';
    appState.history.push('work-list');

    const serviceName = getServiceDisplayName(appState.selectedWorkType);
    const clientName = getClientName(appState.selectedWork.client);

    elements.pageTitle.textContent = `Фотоотчет - ${clientName}`;

    let html = `
        <div class="photo-upload-container">
            <div class="summary-item">
                <div class="summary-label">Тип работы:</div>
                <div class="summary-value">${serviceName}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Клиент:</div>
                <div class="summary-value">${clientName}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Дата:</div>
                <div class="summary-value">${appState.selectedWork.date} ${appState.selectedWork.time}</div>
            </div>
            
            ${appState.selectedWork.organization ? `
                <div class="summary-item">
                    <div class="summary-label">Организация:</div>
                    <div class="summary-value">${appState.selectedWork.organization}</div>
                </div>
            ` : ''}
            
            <div style="margin: 20px 0; border-top: 1px solid var(--border-color); padding-top: 20px;">
                <h4 style="margin-bottom: 15px; color: var(--primary-color);">
                    <i class="fas fa-camera"></i> Фотоотчет
                </h4>
                
                <p style="color: var(--text-secondary); margin-bottom: 15px;">
                    Прикрепите фото выполненной работы (максимум 10 фото):
                </p>
                
                <div class="photo-preview-container" id="photo-preview-container">
                    <div class="add-photo-btn" id="add-photo-btn">
                        <i class="fas fa-plus"></i>
                        <span>Добавить фото</span>
                        <input type="file" id="photo-input" accept="image/*" multiple style="display: none;">
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label>Комментарий к фотоотчету (необязательно)</label>
                    <textarea class="form-control" id="photo-comment" placeholder="Описание выполненных работ..." rows="3"></textarea>
                </div>
            </div>
            
            <button class="btn btn-success" id="submit-photo-report-btn" ${appState.photos.length === 0 ? 'disabled' : ''}>
                <i class="fas fa-paper-plane btn-icon"></i>
                Отправить фотоотчет
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Инициализация загрузки фото
    initPhotoUpload();

    // Обработчик отправки фотоотчета
    document.getElementById('submit-photo-report-btn').addEventListener('click', submitPhotoReport);
}

// Инициализация загрузки фото
function initPhotoUpload() {
    const photoInput = document.createElement('input');
    photoInput.type = 'file';
    photoInput.accept = 'image/*';
    photoInput.multiple = true;
    photoInput.style.display = 'none';

    // Добавляем input в DOM
    document.body.appendChild(photoInput);

    const addPhotoBtn = document.getElementById('add-photo-btn');
    if (addPhotoBtn) {
        addPhotoBtn.addEventListener('click', () => {
            photoInput.click();
        });
    }

    photoInput.addEventListener('change', (event) => {
        const files = Array.from(event.target.files);

        // Ограничиваем количество фото
        const remainingSlots = 10 - appState.photos.length;
        if (files.length > remainingSlots) {
            tg.showAlert(`Можно добавить не более ${remainingSlots} фото`);
            files.splice(remainingSlots);
        }

        files.forEach(file => {
            if (appState.photos.length >= 10) {
                tg.showAlert('Максимальное количество фото - 10');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const photoData = {
                    id: Date.now() + Math.random(),
                    dataUrl: e.target.result,
                    file: file
                };

                appState.photos.push(photoData);
                updatePhotoPreview();
                updateSubmitButton();
            };
            reader.readAsDataURL(file);
        });

        // Сбрасываем input
        photoInput.value = '';
    });
}

// Обновление превью фото
function updatePhotoPreview() {
    const container = document.getElementById('photo-preview-container');

    if (!container) return;

    // Очищаем контейнер
    container.innerHTML = '';

    // Добавляем превью загруженных фото
    appState.photos.forEach((photo, index) => {
        const preview = document.createElement('div');
        preview.className = 'photo-preview';

        preview.innerHTML = `
            <img src="${photo.dataUrl}" alt="Фото ${index + 1}">
            <button class="remove-photo" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(preview);
    });

    // Добавляем кнопку добавления фото, если есть место
    if (appState.photos.length < 10) {
        const addBtn = document.createElement('div');
        addBtn.className = 'add-photo-btn';
        addBtn.id = 'add-photo-btn';
        addBtn.innerHTML = `
            <i class="fas fa-plus"></i>
            <span>Добавить фото</span>
        `;
        container.appendChild(addBtn);

        // Перепривязываем обработчик
        const photoInput = document.querySelector('input[type="file"]');
        if (photoInput) {
            addBtn.addEventListener('click', () => {
                photoInput.click();
            });
        }
    }

    // Добавляем обработчики для удаления фото
    document.querySelectorAll('.remove-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            appState.photos.splice(index, 1);
            updatePhotoPreview();
            updateSubmitButton();
        });
    });
}

// Обновление состояния кнопки отправки
function updateSubmitButton() {
    // Для монтажа МТ
    const mtSubmitBtn = document.getElementById('submit-mt-photo-report-btn');
    if (mtSubmitBtn) {
        mtSubmitBtn.disabled = appState.photos.length === 0;
    }

    // Для других типов работ
    const submitBtn = document.getElementById('submit-photo-report-btn');
    if (submitBtn) {
        submitBtn.disabled = appState.photos.length === 0;
    }
}

// Отправка фотоотчета (для других типов работ)
async function submitPhotoReport() {
    if (appState.photos.length === 0) {
        tg.showAlert('Добавьте хотя бы одно фото');
        return;
    }

    showLoading('Отправка фотоотчета...');

    try {
        // Конвертируем фото в base64
        const photoPromises = appState.photos.map(photo => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Убираем префикс data:image/jpeg;base64,
                    const base64Data = e.target.result.split(',')[1];
                    resolve(base64Data);
                };
                reader.readAsDataURL(photo.file);
            });
        });

        const photosBase64 = await Promise.all(photoPromises);

        // Подготавливаем данные для отправки
        const reportData = {
            action: 'submit_photo_report',
            record_id: appState.selectedWork.id,
            service_type: appState.selectedWorkType,
            photos: photosBase64,
            comment: document.getElementById('photo-comment')?.value.trim() || ''
        };

        // Отправляем данные в бот
        tg.sendData(JSON.stringify(reportData));

        hideLoading();

        // Показываем подтверждение
        showModal(
            '✅ Фотоотчет отправлен!',
            `Фотоотчет успешно отправлен в рабочий чат.<br><br>
             📸 Отправлено фото: ${appState.photos.length}<br>
             🔧 Тип работы: ${getServiceDisplayName(appState.selectedWorkType)}<br>
             👤 Клиент: ${getClientName(appState.selectedWork.client)}<br><br>
             Фото будут проверены менеджером.`
        );

        // Обновляем статус работы локально
        const workIndex = appState.records.findIndex(r => r.id === appState.selectedWork.id);
        if (workIndex !== -1) {
            appState.records[workIndex].status = 'completed';
            appState.records[workIndex].photo_reports = appState.photos.length;
            appState.records[workIndex].photo_reports_data = appState.photos;
            localStorage.setItem('work_records', JSON.stringify(appState.records));
            updateRecordCount();
        }

        // Возвращаемся на главную через 3 секунды
        setTimeout(() => {
            closeModal();
            showMainMenu();
        }, 3000);

    } catch (error) {
        hideLoading();
        console.error('Error submitting photo report:', error);
        tg.showAlert('Ошибка при отправке фотоотчета');
    }
}

// Показать форму поверки ТАХО
function showVerificationForm() {
    appState.currentPage = 'verification';
    appState.history.push('main');

    elements.pageTitle.textContent = 'Поверка ТАХО';
    elements.backBtn.style.display = 'flex';
    elements.mainMenu.style.display = 'none';

    const html = `
        <div class="form-container">
            <div class="form-group">
                <label>Номер ТАХО</label>
                <input type="text" class="form-control" id="taho-number" placeholder="Введите номер тахографа">
            </div>
            
            <div class="form-group">
                <label>Дата последней поверки</label>
                <input type="date" class="form-control" id="last-verification-date">
            </div>
            
            <div class="form-group">
                <label>Дата следующей поверки</label>
                <input type="date" class="form-control" id="next-verification-date">
            </div>
            
            <div class="form-group">
                <label>Организация, проводившая поверку</label>
                <input type="text" class="form-control" id="verification-org" placeholder="Название организации">
            </div>
            
            <div class="form-group">
                <label>Результат поверки</label>
                <select class="form-control" id="verification-result">
                    <option value="passed">Пройдена успешно</option>
                    <option value="failed">Не пройдена</option>
                    <option value="conditional">Условно пройдена</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Комментарий</label>
                <textarea class="form-control" id="verification-comment" placeholder="Дополнительная информация..." rows="3"></textarea>
            </div>
            
            <button class="btn btn-primary" id="save-verification-btn">
                <i class="fas fa-clipboard-check btn-icon"></i>
                Сохранить данные поверки
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Установить даты по умолчанию
    const today = new Date();
    document.getElementById('last-verification-date').value = today.toISOString().split('T')[0];

    const nextDate = new Date(today);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    document.getElementById('next-verification-date').value = nextDate.toISOString().split('T')[0];

    // Обработчик сохранения поверки
    document.getElementById('save-verification-btn').addEventListener('click', () => {
        const verificationData = {
            action: 'save_verification',
            taho_number: document.getElementById('taho-number').value,
            last_verification_date: document.getElementById('last-verification-date').value,
            next_verification_date: document.getElementById('next-verification-date').value,
            organization: document.getElementById('verification-org').value,
            result: document.getElementById('verification-result').value,
            comment: document.getElementById('verification-comment').value
        };

        tg.sendData(JSON.stringify(verificationData));

        showModal('Успех!', 'Данные о поверке сохранены и отправлены.');
        setTimeout(() => {
            closeModal();
            showMainMenu();
        }, 2000);
    });
}

// Показать записи
function showRecords() {
    appState.currentPage = 'records';
    appState.history.push('main');

    elements.pageTitle.textContent = 'История записей';
    elements.backBtn.style.display = 'flex';
    elements.mainMenu.style.display = 'none';

    if (appState.records.length === 0) {
        elements.dynamicContent.innerHTML = `
            <div class="form-container" style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-clipboard-list" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">Записей пока нет</h3>
                <p style="color: var(--text-secondary);">Начните добавлять записи через меню "Записать клиента"</p>
            </div>
        `;
        elements.dynamicContent.style.display = 'block';
        return;
    }

    let html = '<div class="record-list">';

    appState.records.forEach(record => {
        const statusClass = record.status === 'completed' ? 'status-completed' : 'status-pending';
        const statusText = record.status === 'completed' ? 'Выполнено' : 'Запланировано';
        const dateStr = new Date(record.date).toLocaleDateString('ru-RU');

        // Проверяем, является ли запись редактируемой (не сданная работа)
        const isEditable = record.type === 'record' && record.status === 'pending';

        html += `
            <div class="record-item ${isEditable ? 'editable' : ''}" data-record-id="${record.id}">
                <div class="record-header">
                    <span class="record-client">${getClientName(record.client)}</span>
                    <span class="record-date">${dateStr} ${record.time}</span>
                </div>
                <div class="record-service">${record.service === 'appointment' ? 'Запись на прием' : getServiceName(record.service, record.subservice)}</div>
                <div class="record-details">
                    <span class="record-status ${statusClass}">${statusText}</span>
                    ${record.vehicleUnknown ? '<span style="margin-left: 10px;">🚗 Номер ТС: Неизвестен</span>' : ''}
                    ${record.vehicleNumber && !record.vehicleUnknown ? `<span style="margin-left: 10px;">🚗 ${record.vehicleNumber}</span>` : ''}
                </div>
                ${record.organization ? `<p style="margin-top: 8px; font-size: 14px;"><strong>Организация:</strong> ${record.organization}</p>` : ''}
                ${record.contactPerson ? `<p style="margin-top: 4px; font-size: 14px;"><strong>Представитель:</strong> ${record.contactPerson}</p>` : ''}
                ${record.phone ? `<p style="margin-top: 4px; font-size: 14px;"><strong>Телефон:</strong> ${record.phone}</p>` : ''}
                ${record.comment ? `<p style="margin-top: 8px; font-size: 14px; color: var(--text-secondary);">${record.comment}</p>` : ''}
                ${record.photo_reports ? `<p style="margin-top: 4px; font-size: 14px;"><strong>📸 Фотоотчетов:</strong> ${record.photo_reports.length || record.photo_reports}</p>` : ''}
                ${record.mt_install_data ? `<p style="margin-top: 4px; font-size: 14px;"><strong>📱 МТ:</strong> ${record.mt_install_data.mtBrand} №${record.mt_install_data.mtNumber}</p>` : ''}
                
                ${isEditable ? `
                    <div class="record-actions" style="margin-top: 10px;">
                        <button class="btn btn-primary edit-record-btn" style="padding: 6px 12px; font-size: 14px; margin-right: 10px;">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                        <button class="btn btn-danger delete-record-btn" style="padding: 6px 12px; font-size: 14px;">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    });

    html += '</div>';

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Добавляем обработчики для кнопок редактирования
    document.querySelectorAll('.edit-record-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const recordId = parseInt(btn.closest('.record-item').dataset.recordId);
            const record = appState.records.find(r => r.id === recordId);
            if (record) {
                showEditRecordForm(record);
            }
        });
    });

    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll('.delete-record-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const recordId = parseInt(btn.closest('.record-item').dataset.recordId);
            deleteRecord(recordId);
        });
    });
}

// Показать форму редактирования записи
function showEditRecordForm(record) {
    appState.currentPage = 'edit-record';
    appState.history.push('records');
    appState.selectedRecord = record;

    const clientName = getClientName(record.client);
    elements.pageTitle.textContent = `Редактировать запись - ${clientName}`;

    let html = `
        <div class="form-section">
            <div class="form-section-title">📅 Информация о записи</div>
            <div class="summary-item">
                <div class="summary-label">Клиент:</div>
                <div class="summary-value">${clientName}</div>
            </div>
        </div>
        
        <div class="form-section">
            <div class="form-section-title">🏢 Данные организации</div>
            
            <div class="input-group">
                <label class="required">Организация</label>
                <input type="text" class="form-input" id="edit-organization" 
                       placeholder="Введите название организации" 
                       value="${record.organization || ''}">
                <div class="error-message" id="edit-organization-error">Пожалуйста, введите название организации</div>
            </div>
            
            <div class="input-group">
                <label class="required">Представитель</label>
                <input type="text" class="form-input" id="edit-contact-person" 
                       placeholder="ФИО представителя" 
                       value="${record.contactPerson || ''}">
                <div class="error-message" id="edit-contact-person-error">Пожалуйста, введите ФИО представителя</div>
            </div>
            
            <div class="input-group">
                <label class="required">Телефон</label>
                <input type="tel" class="form-input" id="edit-phone" 
                       placeholder="+7 (999) 123-45-67" 
                       value="${record.phone || ''}">
                <div class="error-message" id="edit-phone-error">Пожалуйста, введите корректный номер телефона</div>
            </div>
        </div>
        
        <div class="form-section">
            <div class="form-section-title">📅 Дата и время</div>
            
            <div class="input-group">
                <label class="required">Дата</label>
                <input type="date" class="form-input" id="edit-date" 
                       value="${record.date}">
            </div>
            
            <div class="input-group">
                <label class="required">Время</label>
                <input type="time" class="form-input" id="edit-time" 
                       value="${record.time}">
            </div>
        </div>
        
        <div class="form-section">
            <div class="form-section-title">🚗 Данные транспортного средства</div>
            
            <div class="input-group">
                <label>Номер ТС</label>
                <input type="text" class="form-input" id="edit-vehicle-number" 
                       placeholder="А123БВ777" 
                       value="${record.vehicleNumber || ''}"
                       ${record.vehicleUnknown ? 'disabled' : ''}>
            </div>
            
            <div class="checkbox-group" style="margin-top: 15px;">
                <input type="checkbox" id="edit-vehicle-unknown" ${record.vehicleUnknown ? 'checked' : ''}>
                <label for="edit-vehicle-unknown" style="margin-left: 8px; font-size: 14px;">
                    Номер ТС неизвестен
                </label>
            </div>
        </div>
        
        <div class="form-section">
            <div class="form-section-title">💬 Комментарий</div>
            
            <div class="input-group">
                <label>Комментарий</label>
                <textarea class="form-input" id="edit-comment" 
                       placeholder="Дополнительная информация..." 
                       rows="3">${record.comment || ''}</textarea>
            </div>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button class="btn btn-success" id="update-record-btn" style="flex: 1;">
                <i class="fas fa-save btn-icon"></i>
                Сохранить изменения
            </button>
            <button class="btn btn-danger" id="delete-record-btn" style="flex: 1;">
                <i class="fas fa-trash btn-icon"></i>
                Удалить запись
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Обработчик чекбокса "Номер ТС неизвестен"
    document.getElementById('edit-vehicle-unknown').addEventListener('change', function() {
        const vehicleNumberInput = document.getElementById('edit-vehicle-number');
        if (this.checked) {
            vehicleNumberInput.disabled = true;
            vehicleNumberInput.value = '';
            vehicleNumberInput.placeholder = 'Неизвестен';
        } else {
            vehicleNumberInput.disabled = false;
            vehicleNumberInput.placeholder = 'А123БВ777';
        }
    });

    // Валидация полей в реальном времени
    document.getElementById('edit-organization').addEventListener('input', validateEditForm);
    document.getElementById('edit-contact-person').addEventListener('input', validateEditForm);
    document.getElementById('edit-phone').addEventListener('input', validateEditForm);

    // Обработчик сохранения изменений
    document.getElementById('update-record-btn').addEventListener('click', () => {
        updateRecord(record.id);
    });

    // Обработчик удаления записи
    document.getElementById('delete-record-btn').addEventListener('click', () => {
        deleteRecord(record.id);
    });
}

// Валидация формы редактирования
function validateEditForm() {
    const organization = document.getElementById('edit-organization').value.trim();
    const contactPerson = document.getElementById('edit-contact-person').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();

    let isValid = true;

    // Валидация организации
    if (!organization) {
        document.getElementById('edit-organization-error').style.display = 'block';
        document.getElementById('edit-organization').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('edit-organization-error').style.display = 'none';
        document.getElementById('edit-organization').classList.remove('error');
    }

    // Валидация представителя
    if (!contactPerson) {
        document.getElementById('edit-contact-person-error').style.display = 'block';
        document.getElementById('edit-contact-person').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('edit-contact-person-error').style.display = 'none';
        document.getElementById('edit-contact-person').classList.remove('error');
    }

    // Валидация телефона
    const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    if (!phone || !phoneRegex.test(phone.replace(/\D/g, ''))) {
        document.getElementById('edit-phone-error').style.display = 'block';
        document.getElementById('edit-phone').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('edit-phone-error').style.display = 'none';
        document.getElementById('edit-phone').classList.remove('error');
    }

    return isValid;
}

// Обновить запись
function updateRecord(recordId) {
    // Валидация
    if (!validateEditForm()) {
        tg.showAlert('Пожалуйста, заполните все обязательные поля корректно');
        return;
    }

    const organization = document.getElementById('edit-organization').value.trim();
    const contactPerson = document.getElementById('edit-contact-person').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const date = document.getElementById('edit-date').value;
    const time = document.getElementById('edit-time').value;

    if (!date || !time) {
        tg.showAlert('Пожалуйста, заполните дату и время');
        return;
    }

    // Находим запись
    const recordIndex = appState.records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) {
        tg.showAlert('Запись не найдена');
        return;
    }

    // Подготавливаем данные для обновления
    const updateData = {
        action: 'update_record',
        record_id: recordId,
        organization,
        contact_person: contactPerson,
        phone,
        date,
        time,
        car_number: document.getElementById('edit-vehicle-number').value.trim(),
        car_unknown: document.getElementById('edit-vehicle-unknown').checked,
        comment: document.getElementById('edit-comment').value.trim()
    };

    // Отправляем данные в бот
    tg.sendData(JSON.stringify(updateData));

    // Обновляем запись локально
    appState.records[recordIndex] = {
        ...appState.records[recordIndex],
        organization,
        contactPerson,
        phone,
        date,
        time,
        vehicleNumber: updateData.car_number,
        vehicleUnknown: updateData.car_unknown,
        comment: updateData.comment,
        updatedAt: new Date().toISOString()
    };

    // Сохраняем в localStorage
    localStorage.setItem('work_records', JSON.stringify(appState.records));

    // Обновляем счетчик
    updateRecordCount();

    tg.showAlert('Запись успешно обновлена');

    // Возвращаемся к списку записей
    setTimeout(() => {
        showRecords();
    }, 1000);
}

// Удалить запись
function deleteRecord(recordId) {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
        return;
    }

    const recordIndex = appState.records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) {
        tg.showAlert('Запись не найдена');
        return;
    }

    // Отправляем данные в бот
    const deleteData = {
        action: 'delete_record',
        record_id: recordId
    };

    tg.sendData(JSON.stringify(deleteData));

    // Удаляем запись локально
    appState.records.splice(recordIndex, 1);

    // Сохраняем в localStorage
    localStorage.setItem('work_records', JSON.stringify(appState.records));

    // Обновляем счетчик
    updateRecordCount();

    tg.showAlert('Запись успешно удалена');

    // Возвращаемся к списку записей
    setTimeout(() => {
        showRecords();
    }, 1000);
}

// Показать настройки
function showSettings() {
    appState.currentPage = 'settings';
    appState.history.push('main');

    elements.pageTitle.textContent = 'Настройки';
    elements.backBtn.style.display = 'flex';
    elements.mainMenu.style.display = 'none';

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const html = `
        <div class="settings-list">
            <div class="setting-item">
                <div class="setting-text">
                    <h4>Темная тема</h4>
                    <p>Включить темный режим</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="dark-mode-toggle" ${isDark ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="setting-item">
                <div class="setting-text">
                    <h4>Уведомления</h4>
                    <p>Получать уведомления о новых записях</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="notifications-toggle" checked>
                    <span class="slider round"></span>
                </label>
            </div>
            
            <div class="setting-item">
                <div class="setting-text">
                    <h4>Экспорт данных</h4>
                    <p>Скачать все записи в формате CSV</p>
                </div>
                <button class="btn btn-secondary" style="width: auto; padding: 6px 12px;" id="export-btn">
                    <i class="fas fa-download"></i>
                </button>
            </div>
            
            <div class="setting-item">
                <div class="setting-text">
                    <h4>Очистить данные</h4>
                    <p>Удалить все записи (действие необратимо)</p>
                </div>
                <button class="btn btn-danger" style="width: auto; padding: 6px 12px;" id="clear-data-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="setting-item">
                <div class="setting-text">
                    <h4>О приложении</h4>
                    <p>Версия 2.1.0 (новая система сдачи работ)</p>
                </div>
                <button class="btn" style="width: auto; padding: 6px 12px; background: var(--primary-color); color: white;" id="about-btn">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    // Обработчики настроек
    document.getElementById('dark-mode-toggle').addEventListener('change', function() {
        const theme = this.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });

    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('clear-data-btn').addEventListener('click', clearData);
    document.getElementById('about-btn').addEventListener('click', showAbout);
}

// Вспомогательные функции
function getClientName(clientId) {
    const clients = {
        'its': 'Клиент ИТС',
        'skai': 'Клиент SKAI',
        'tt': 'Клиент ТТ',
        'citypoint': 'Клиент CityPoint'
    };
    return clients[clientId] || clientId;
}

function getServiceName(serviceId, subserviceId = null) {
    const services = {
        'mt_install': 'Монтаж МТ',
        'mt_diagnostic': 'Диагностика МТ',
        'asn_install': 'Монтаж АСН',
        'asn_diagnostic': 'Диагностика АСН',
        'taho_install': subserviceId ? getTahoSubserviceName(subserviceId) : 'Монтаж ТАХО',
        'taho_demount': 'Демонтаж ТАХО',
        'taho_diagnostic': 'Диагностика ТАХО',
        'appointment': 'Запись на прием'
    };

    return services[serviceId] || serviceId;
}

function getTahoSubserviceName(subserviceId) {
    const subservices = {
        'taho_basic': 'Монтаж ТАХО',
        'taho_ds': 'Монтаж ТАХО + ДС',
        'taho_ds_pps': 'Монтаж ТАХО+ДС+ППС'
    };
    return subservices[subserviceId] || subserviceId;
}

function getServiceDisplayName(serviceType) {
    const displayNames = {
        'mt_install': 'Монтаж МТ',
        'asn_install': 'Монтаж АСН',
        'taho_install': 'Монтаж ТАХО',
        'diagnostic': 'Диагностика'
    };
    return displayNames[serviceType] || serviceType;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function showLoading(message = 'Загрузка...') {
    let loadingOverlay = document.getElementById('loading-overlay');

    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div style="text-align: center;">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    }

    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showModal(title, content) {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = content;
    elements.modalOverlay.style.display = 'flex';
    tg.HapticFeedback.impactOccurred('medium');
}

function closeModal() {
    elements.modalOverlay.style.display = 'none';
}

function exportData() {
    if (appState.records.length === 0) {
        showModal('Ошибка', 'Нет данных для экспорта');
        return;
    }

    // Создание CSV
    let csv = 'Клиент;Организация;Представитель;Телефон;Дата;Время;Статус;Комментарий;Автомобиль;Номер неизвестен;Фотоотчеты;Марка МТ;Номер МТ;Марка ТС\n';

    appState.records.forEach(record => {
        csv += `${getClientName(record.client)};${record.organization || ''};${record.contactPerson || ''};${record.phone || ''};${record.date};${record.time};${record.status === 'completed' ? 'Выполнено' : 'Запланировано'};${record.comment || ''};${record.vehicleNumber || ''};${record.vehicleUnknown ? 'Да' : 'Нет'};${record.photo_reports ? (record.photo_reports.length || record.photo_reports) : 0};`;

        // Добавляем данные монтажа МТ, если есть
        if (record.mt_install_data) {
            csv += `${record.mt_install_data.mtBrand || ''};${record.mt_install_data.mtNumber || ''};${record.mt_install_data.vehicleBrand || ''} ${record.mt_install_data.vehicleModel || ''}`;
        } else {
            csv += ';;';
        }

        csv += '\n';
    });

    // Создание Blob и скачивание
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `work_records_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();

    showModal('Успех', 'Данные экспортированы в формате CSV');
}

function clearData() {
    if (confirm('Вы уверены, что хотите удалить все записи? Это действие необратимо.')) {
        appState.records = [];
        localStorage.removeItem('work_records');
        updateRecordCount();
        showModal('Успех', 'Все записи удалены');
        setTimeout(() => {
            closeModal();
            showMainMenu();
        }, 2000);
    }
}

function showAbout() {
    showModal('О приложении', `
        <div style="text-align: center;">
            <i class="fas fa-tachometer-alt" style="font-size: 48px; color: var(--primary-color); margin-bottom: 20px;"></i>
            <h3 style="margin-bottom: 10px;">Учет работ v2.1.0</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                Приложение для учета работ по установке и обслуживанию тахографов
            </p>
            <div style="background: var(--light-bg); padding: 15px; border-radius: 10px; margin-top: 20px;">
                <p style="margin-bottom: 5px;"><strong>Новая система сдачи работ:</strong></p>
                <p style="margin-bottom: 5px;">• Монтаж МТ с чекбоксами выбора фото</p>
                <p style="margin-bottom: 5px;">• Сим карта, ID МТ, место установки</p>
                <p style="margin-bottom: 5px;">• Пломбки и все необходимые фото</p>
                <p style="margin-bottom: 5px;">• Ввод данных о ТС и МТ</p>
                <p><strong>Новая система записи:</strong></p>
                <p style="margin-bottom: 5px;">• Выбор клиента</p>
                <p style="margin-bottom: 5px;">• Календарь с выбором даты</p>
                <p style="margin-bottom: 5px;">• Выбор времени с интервалом 10 мин</p>
                <p style="margin-bottom: 5px;">• Обед 13:00-14:00</p>
                <p style="margin-bottom: 5px;">• Заполнение данных организации</p>
                <p style="margin-bottom: 5px;">• Галочка "Номер ТС неизвестен"</p>
                <p><strong>Редактирование записей:</strong></p>
                <p style="margin-bottom: 5px;">• Изменение всех данных записи</p>
                <p style="margin-bottom: 5px;">• Удаление записей</p>
                <p><strong>Дата сборки:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
            </div>
        </div>
    `);
}

// Навигация назад
function goBack() {
    if (appState.currentPage === 'client-selection') {
        showMainMenu();
    } else if (appState.currentPage === 'calendar') {
        showClientSelection();
    } else if (appState.currentPage === 'time-selection') {
        showCalendar();
    } else if (appState.currentPage === 'appointment-form') {
        showTimeSelection();
    } else if (appState.currentPage === 'service-type-selection') {
        showMainMenu();
    } else if (appState.currentPage === 'work-list') {
        showServiceTypeSelection();
    } else if (appState.currentPage === 'photo-upload') {
        showWorkList();
    } else if (appState.currentPage === 'verification') {
        showMainMenu();
    } else if (appState.currentPage === 'records') {
        showMainMenu();
    } else if (appState.currentPage === 'edit-record') {
        showRecords();
    } else if (appState.currentPage === 'settings') {
        showMainMenu();
    } else if (appState.currentPage === 'mt-install-form') {
        showWorkList();
    } else if (appState.currentPage === 'mt-photo-upload') {
        showMtInstallForm();
    } else if (appState.history.length > 0) {
        const prevPage = appState.history.pop();

        switch(prevPage) {
            case 'main':
                showMainMenu();
                break;
            case 'client-selection':
                showClientSelection();
                break;
            case 'service-type-selection':
                showServiceTypeSelection();
                break;
            case 'work-list':
                showWorkList();
                break;
            case 'mt-install-form':
                showWorkList();
                break;
        }
    } else {
        showMainMenu();
    }
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Отправка отложенных запросов при загрузке
document.addEventListener('DOMContentLoaded', sendPendingSubmissions);

// Обработка закрытия приложения
tg.onEvent('viewportChanged', (event) => {
    console.log('Viewport changed:', event);
});

// Инициализация кнопки "Назад" в Telegram
if (tg.BackButton) {
    tg.BackButton.onClick(() => {
        goBack();
    });
}
