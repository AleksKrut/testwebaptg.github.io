// Функции меню и навигации

function showMainMenu() {
    appState.currentPage = 'main';
    appState.history = [];

    elements.pageTitle.textContent = 'Главное меню';
    elements.backBtn.style.display = 'none';
    elements.mainMenu.style.display = 'flex';
    elements.dynamicContent.style.display = 'none';

    updateRecordCount();
}

function showClientSelection() {
    appState.currentPage = 'client-selection';
    appState.history.push('main');

    appState.selectedDate = null;
    appState.selectedTime = null;
    appState.currentService = null;
    appState.currentSubservice = null;
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

    document.querySelectorAll('.submenu-item[data-client]').forEach(item => {
        item.addEventListener('click', () => {
            const clientId = item.dataset.client;
            appState.currentClient = clientId;

            if (clientServices[clientId] && clientServices[clientId].length > 0) {
                showServiceSelectionForClient(clientId);
            } else {
                showCalendar();
            }
        });
    });
}

function showServiceSelectionForClient(clientId) {
    appState.currentPage = 'service-selection';
    appState.history.push('client-selection');

    appState.currentService = null;
    appState.currentSubservice = null;
    appState.selectedDate = null;
    appState.selectedTime = null;

    const clientName = getClientName(clientId);
    elements.pageTitle.textContent = `Выберите услугу - ${clientName}`;
    elements.backBtn.style.display = 'flex';
    elements.mainMenu.style.display = 'none';

    const services = clientServices[clientId] || [];

    let html = '<div class="submenu-container">';
    services.forEach(service => {
        html += `
            <div class="submenu-item" data-service="${service.id}" ${service.hasSubmenu ? 'data-has-submenu="true"' : ''}>
                <i class="${service.icon}"></i>
                <div class="submenu-text">
                    <h4>${service.name}</h4>
                    <p>${service.description}</p>
                </div>
                ${service.hasSubmenu ? '<i class="fas fa-chevron-right"></i>' : ''}
            </div>
        `;
    });
    html += '</div>';

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    document.querySelectorAll('.submenu-item[data-service]').forEach(item => {
        item.addEventListener('click', () => {
            const serviceId = item.dataset.service;
            appState.currentService = serviceId;

            if (item.dataset.hasSubmenu === 'true') {
                showTahoSubserviceSelection(serviceId);
            } else {
                showCalendar();
            }
        });
    });
}

function showTahoSubserviceSelection(serviceId) {
    appState.currentPage = 'subservice-selection';
    appState.history.push('service-selection');

    const clientName = getClientName(appState.currentClient);
    elements.pageTitle.textContent = `Выберите тип монтажа ТАХО - ${clientName}`;

    const tahoService = clientServices[appState.currentClient]?.find(s => s.id === serviceId);
    const subservices = tahoService?.subservices || [];

    let html = '<div class="submenu-container">';
    subservices.forEach(subservice => {
        html += `
            <div class="submenu-item" data-subservice="${subservice.id}">
                <i class="fas fa-tachometer-alt"></i>
                <div class="submenu-text">
                    <h4>${subservice.name}</h4>
                    <p>${tahoService.description}</p>
                </div>
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
    });
    html += '</div>';

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    document.querySelectorAll('.submenu-item[data-subservice]').forEach(item => {
        item.addEventListener('click', () => {
            appState.currentSubservice = item.dataset.subservice;
            showCalendar();
        });
    });
}

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

    const today = new Date();
    document.getElementById('last-verification-date').value = today.toISOString().split('T')[0];

    const nextDate = new Date(today);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    document.getElementById('next-verification-date').value = nextDate.toISOString().split('T')[0];

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

    // Отправляем боту через WebApp
    tg.sendData(JSON.stringify(verificationData));

    // Отправляем в Telegram чат в топик 270
    sendVerificationToTelegram(verificationData);

    showModal('Успех!', 'Данные о поверке сохранены и отправлены в топик #270.');
    setTimeout(() => {
        closeModal();
        showMainMenu();
    }, 2000);
});
}

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

    document.getElementById('dark-mode-toggle').addEventListener('change', function() {
        const theme = this.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });

    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('clear-data-btn').addEventListener('click', clearData);
    document.getElementById('about-btn').addEventListener('click', showAbout);
}

// Экспорт функций
window.showMainMenu = showMainMenu;
window.showClientSelection = showClientSelection;
window.showServiceSelectionForClient = showServiceSelectionForClient;
window.showTahoSubserviceSelection = showTahoSubserviceSelection;
window.showVerificationForm = showVerificationForm;
window.showSettings = showSettings;