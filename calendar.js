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
            
            <div class="checkbox-group" style="margin-top: 15px;">
                <input type="checkbox" id="contact-unknown" ${appState.appointmentData.contactUnknown ? 'checked' : ''}>
                <label for="contact-unknown" style="margin-left: 8px; font-size: 14px;">
                    Представитель неизвестен
                </label>
            </div>
            
            <div id="contact-fields" style="${appState.appointmentData.contactUnknown ? 'display: none;' : ''}">
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

    document.getElementById('contact-unknown').addEventListener('change', function() {
        const contactFields = document.getElementById('contact-fields');
        const contactPersonInput = document.getElementById('contact-person');
        const phoneInput = document.getElementById('phone');
        
        if (this.checked) {
            contactFields.style.display = 'none';
            contactPersonInput.value = '';
            phoneInput.value = '';
            contactPersonInput.required = false;
            phoneInput.required = false;
        } else {
            contactFields.style.display = 'block';
            contactPersonInput.required = true;
            phoneInput.required = true;
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
    const contactUnknown = document.getElementById('contact-unknown').checked;

    let isValid = true;

    if (!organization) {
        document.getElementById('organization-error').style.display = 'block';
        document.getElementById('organization').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('organization-error').style.display = 'none';
        document.getElementById('organization').classList.remove('error');
    }

    if (!contactUnknown) {
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
    }

    return isValid;
}

function saveAppointment() {
    if (!validateForm()) {
        tg.showAlert('Пожалуйста, заполните все обязательные поля корректно');
        return;
    }

    const contactUnknown = document.getElementById('contact-unknown').checked;

    appState.appointmentData = {
        organization: document.getElementById('organization').value.trim(),
        contactPerson: contactUnknown ? '' : document.getElementById('contact-person').value.trim(),
        phone: contactUnknown ? '' : document.getElementById('phone').value.trim(),
        vehicleNumber: document.getElementById('vehicle-number').value.trim(),
        vehicleUnknown: document.getElementById('vehicle-unknown').checked,
        contactUnknown: contactUnknown,
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
        contactUnknown: appState.appointmentData.contactUnknown,
        comment: appState.appointmentData.comment,
        status: 'pending',
        type: 'record',
        work_type: 'record',
        createdAt: new Date().toISOString(),
        createdBy: tg.initDataUnsafe.user?.id || 'unknown'
    };

    appState.records.unshift(record);
    localStorage.setItem('work_records', JSON.stringify(appState.records));

    // Отправляем данные боту
    sendToBot(record);

    // Отправляем в Telegram чат в топик 7
    sendAppointmentToTelegram(record);

    showConfirmation(record);
}