// Общие функции приложения

function setupTheme() {
    const isDark = localStorage.getItem('theme') === 'dark' ||
                   (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

function goBack() {
    if (appState.currentPage === 'client-selection') {
        showMainMenu();
    } else if (appState.currentPage === 'service-selection') {
        showClientSelection();
    } else if (appState.currentPage === 'subservice-selection') {
        showServiceSelectionForClient(appState.currentClient);
    } else if (appState.currentPage === 'calendar') {
        if (appState.currentSubservice) {
            showTahoSubserviceSelection(appState.currentService);
        } else if (appState.currentService) {
            showServiceSelectionForClient(appState.currentClient);
        } else {
            showClientSelection();
        }
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
            case 'service-selection':
                showServiceSelectionForClient(appState.currentClient);
                break;
            case 'subservice-selection':
                showTahoSubserviceSelection(appState.currentService);
                break;
        }
    } else {
        showMainMenu();
    }
}

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

function sendToBot(record) {
    try {
        const data = {
            action: 'save_appointment',
            client: record.client,
            service: record.service,
            subservice: record.subservice,
            date: record.date,
            time: record.time,
            organization: record.organization,
            contact_person: record.contactPerson,
            phone: record.phone,
            car_number: record.vehicleNumber,
            car_unknown: record.vehicleUnknown,
            comment: record.comment
        };

        tg.sendData(JSON.stringify(data));
        console.log('Данные отправлены в бот:', data);
    } catch (error) {
        console.error('Ошибка отправки данных в бот:', error);
        const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
        pending.push(data);
        localStorage.setItem('pending_submissions', JSON.stringify(pending));
    }
}

function sendPendingSubmissions() {
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

    localStorage.removeItem('pending_submissions');
}

function exportData() {
    if (appState.records.length === 0) {
        showModal('Ошибка', 'Нет данных для экспорта');
        return;
    }

    let csv = 'Клиент;Организация;Представитель;Телефон;Дата;Время;Статус;Комментарий;Автомобиль;Номер неизвестен;Фотоотчеты;Марка МТ;Номер МТ;Марка ТС\n';

    appState.records.forEach(record => {
        csv += `${getClientName(record.client)};${record.organization || ''};${record.contactPerson || ''};${record.phone || ''};${record.date};${record.time};${record.status === 'completed' ? 'Выполнено' : 'Запланировано'};${record.comment || ''};${record.vehicleNumber || ''};${record.vehicleUnknown ? 'Да' : 'Нет'};${record.photo_reports ? (record.photo_reports.length || record.photo_reports) : 0};`;

        if (record.mt_install_data) {
            csv += `${record.mt_install_data.mtBrand || ''};${record.mt_install_data.mtNumber || ''};${record.mt_install_data.vehicleBrand || ''} ${record.mt_install_data.vehicleModel || ''}`;
        } else {
            csv += ';;';
        }

        csv += '\n';
    });

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

// Экспорт функций
window.setupTheme = setupTheme;
window.goBack = goBack;
window.handleMenuAction = handleMenuAction;
window.sendToBot = sendToBot;
window.sendPendingSubmissions = sendPendingSubmissions;
window.exportData = exportData;
window.clearData = clearData;
window.showAbout = showAbout;