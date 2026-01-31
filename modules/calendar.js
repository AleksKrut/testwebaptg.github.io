// Функции календаря и времени

function showCalendar() {
    appState.currentPage = 'calendar';

    if (appState.currentSubservice) {
        appState.history.push('subservice-selection');
    } else if (appState.currentService) {
        appState.history.push('service-selection');
    } else {
        appState.history.push('client-selection');
    }

    const clientName = getClientName(appState.currentClient);
    let serviceInfo = '';

    if (appState.currentService) {
        serviceInfo = ` - ${getServiceName(appState.currentService, appState.currentSubservice)}`;
    }

    elements.pageTitle.textContent = `Выберите дату - ${clientName}${serviceInfo}`;

    const today = new Date();
    appState.currentCalendar.year = today.getFullYear();
    appState.currentCalendar.month = today.getMonth();

    renderCalendar(appState.currentCalendar.year, appState.currentCalendar.month);
}

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

    let firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7;

    for (let i = 1; i < firstDayOfWeek; i++) {
        html += '<div class="calendar-day disabled"></div>';
    }

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

    document.querySelectorAll('.calendar-day.selectable').forEach(dayElement => {
        dayElement.addEventListener('click', () => {
            const day = parseInt(dayElement.dataset.day);
            const dateStr = dayElement.dataset.date;
            appState.selectedDate = new Date(dateStr);
            showTimeSelection();
        });
    });
}

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

    const timeSlots = [];
    const startHour = 9;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 10) {
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

    timeSlots.forEach(timeSlot => {
        const isSelected = appState.selectedTime === timeSlot;
        const timeClass = isSelected ? 'time-slot selected' : 'time-slot';

        html += `<div class="${timeClass}" data-time="${timeSlot}">${timeSlot}</div>`;
    });

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

    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            document.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
            });

            slot.classList.add('selected');
            appState.selectedTime = slot.dataset.time;

            document.getElementById('confirm-time-btn').disabled = false;
        });
    });

    document.getElementById('confirm-time-btn').addEventListener('click', () => {
        showAppointmentForm();
    });
}

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
            ${appState.currentService ? `
                <div class="summary-item">
                    <div class="summary-label">Услуга:</div>
                    <div class="summary-value">${getServiceName(appState.currentService, appState.currentSubservice)}</div>
                </div>
            ` : ''}
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

    document.getElementById('save-appointment-btn').addEventListener('click', saveAppointment);

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

    document.getElementById('organization').addEventListener('input', validateForm);
    document.getElementById('contact-person').addEventListener('input', validateForm);
    document.getElementById('phone').addEventListener('input', validateForm);
}

function validateForm() {
    const organization = document.getElementById('organization').value.trim();
    const contactPerson = document.getElementById('contact-person').value.trim();
    const phone = document.getElementById('phone').value.trim();

    let isValid = true;

    if (!organization) {
        document.getElementById('organization-error').style.display = 'block';
        document.getElementById('organization').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('organization-error').style.display = 'none';
        document.getElementById('organization').classList.remove('error');
    }

    if (!contactPerson) {
        document.getElementById('contact-person-error').style.display = 'block';
        document.getElementById('contact-person').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('contact-person-error').style.display = 'none';
        document.getElementById('contact-person').classList.remove('error');
    }

    const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    if (!phone || !phoneRegex.test(phone.replace(/\D/g, ''))) {
        document.getElementById('phone-error').style.display = 'block';
        document.getElementById('phone').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('phone-error').style.display = 'none';
        document.getElementById('phone').classList.remove('error');
    }

    return isValid;
}

function saveAppointment() {
    if (!validateForm()) {
        tg.showAlert('Пожалуйста, заполните все обязательные поля корректно');
        return;
    }

    appState.appointmentData = {
        organization: document.getElementById('organization').value.trim(),
        contactPerson: document.getElementById('contact-person').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        vehicleNumber: document.getElementById('vehicle-number').value.trim(),
        vehicleUnknown: document.getElementById('vehicle-unknown').checked,
        comment: document.getElementById('comment').value.trim()
    };

    const record = {
        id: Date.now(),
        client: appState.currentClient,
        service: appState.currentService,
        subservice: appState.currentSubservice,
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

    appState.records.unshift(record);
    localStorage.setItem('work_records', JSON.stringify(appState.records));

    sendToBot(record);
    showConfirmation(record);
}

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
                ${record.service ? `<p><strong>Услуга:</strong> ${getServiceName(record.service, record.subservice)}</p>` : ''}
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

    updateRecordCount();

    setTimeout(() => {
        closeModal();
        showMainMenu();
    }, 3000);
}

// Экспорт функций
window.showCalendar = showCalendar;
window.renderCalendar = renderCalendar;
window.showTimeSelection = showTimeSelection;
window.showAppointmentForm = showAppointmentForm;
window.validateForm = validateForm;
window.saveAppointment = saveAppointment;
window.showConfirmation = showConfirmation;