// Основной файл приложения

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

    // Попробовать отправить отложенные отчеты
    retryPendingWorkReports();
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

        const isEditable = record.type === 'record' && record.status === 'pending';

        html += `
            <div class="record-item ${isEditable ? 'editable' : ''}" data-record-id="${record.id}">
                <div class="record-header">
                    <span class="record-client">${getClientName(record.client)}</span>
                    <span class="record-date">${dateStr} ${record.time}</span>
                </div>
                <div class="record-service">${getServiceDisplayName(record.service)}</div>
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

    document.getElementById('edit-organization').addEventListener('input', validateEditForm);
    document.getElementById('edit-contact-person').addEventListener('input', validateEditForm);
    document.getElementById('edit-phone').addEventListener('input', validateEditForm);

    document.getElementById('update-record-btn').addEventListener('click', () => {
        updateRecord(record.id);
    });

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

    if (!organization) {
        document.getElementById('edit-organization-error').style.display = 'block';
        document.getElementById('edit-organization').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('edit-organization-error').style.display = 'none';
        document.getElementById('edit-organization').classList.remove('error');
    }

    if (!contactPerson) {
        document.getElementById('edit-contact-person-error').style.display = 'block';
        document.getElementById('edit-contact-person').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('edit-contact-person-error').style.display = 'none';
        document.getElementById('edit-contact-person').classList.remove('error');
    }

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

    const recordIndex = appState.records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) {
        tg.showAlert('Запись не найдена');
        return;
    }

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

    tg.sendData(JSON.stringify(updateData));

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

    localStorage.setItem('work_records', JSON.stringify(appState.records));

    updateRecordCount();

    tg.showAlert('Запись успешно обновлена');

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

    const deleteData = {
        action: 'delete_record',
        record_id: recordId
    };

    tg.sendData(JSON.stringify(deleteData));

    appState.records.splice(recordIndex, 1);

    localStorage.setItem('work_records', JSON.stringify(appState.records));

    updateRecordCount();

    tg.showAlert('Запись успешно удалена');

    setTimeout(() => {
        showRecords();
    }, 1000);
}

// Запуск приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Отправка отложенных запросов при загрузке
document.addEventListener('DOMContentLoaded', () => {
    sendPendingSubmissions();
    retryPendingWorkReports();
});

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

// Экспорт функций
window.initApp = initApp;
window.setupEventListeners = setupEventListeners;
window.showRecords = showRecords;
window.showEditRecordForm = showEditRecordForm;
window.validateEditForm = validateEditForm;
window.updateRecord = updateRecord;
window.deleteRecord = deleteRecord;