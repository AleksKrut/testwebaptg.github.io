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
        showTahoSubserviceSelection(appState.currentService);
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
    } else if (appState.currentPage === 'work-organization-form') {
        showWorkList();
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
            case 'work-organization-form':
                showWorkList();
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
        console.log('Данные записи отправлены в бот:', data);

        // Также отправляем в Telegram чат
        sendAppointmentToTelegram(record);

    } catch (error) {
        console.error('Ошибка отправки данных записи в бот:', error);
        const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
        pending.push(data);
        localStorage.setItem('pending_submissions', JSON.stringify(pending));
    }
}

async function sendAppointmentToTelegram(record) {
    try {
        const message = formatAppointmentMessage(record);
        const topicId = getTopicForAction('appointment', record.client);

        await sendMessageToTelegram(message, topicId);
        console.log('Запись клиента отправлена в Telegram чат');
        return true;
    } catch (error) {
        console.error('Ошибка отправки записи клиента в Telegram:', error);
        return false;
    }
}

async function sendWorkReportToTelegram(reportData) {
    try {
        const message = formatWorkReportMessage(reportData);
        const topicId = getTopicForAction('submit_complete_work_report', reportData.client);

        // Отправляем текстовое сообщение
        await sendMessageToTelegram(message, topicId);

        // Отправляем фото (если есть)
        if (reportData.photos && reportData.photos.length > 0) {
            const photosToSend = reportData.photos.slice(0, telegramConfig.maxPhotosPerReport);
            for (let i = 0; i < photosToSend.length; i++) {
                try {
                    // Для первого фото добавляем подпись
                    const caption = i === 0 ? 'Фотоотчет к работе' : '';
                    await sendPhotoToTelegram(photosToSend[i], topicId, caption);

                    // Пауза между отправками фото
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (photoError) {
                    console.error(`Ошибка отправки фото ${i + 1}:`, photoError);
                }
            }
        }

        console.log('Отчет о работе отправлен в Telegram чат');
        return true;
    } catch (error) {
        console.error('Ошибка отправки отчета о работе в Telegram:', error);
        return false;
    }
}

async function sendVerificationToTelegram(verificationData) {
    try {
        const message = formatVerificationMessage(verificationData);
        const topicId = getTopicForAction('verification');

        await sendMessageToTelegram(message, topicId);
        console.log('Данные поверки отправлены в Telegram чат');
        return true;
    } catch (error) {
        console.error('Ошибка отправки данных поверки в Telegram:', error);
        return false;
    }
}

// Основная функция отправки сообщения в Telegram
async function sendMessageToTelegram(message, topicId) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: telegramConfig.staffChatId,
                message_thread_id: topicId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const result = await response.json();

        if (!result.ok) {
            console.error('Ошибка отправки сообщения в Telegram:', result);
            throw new Error('Не удалось отправить сообщение в Telegram');
        }

        return result;
    } catch (error) {
        console.error('Ошибка отправки сообщения в Telegram:', error);
        throw error;
    }
}

// Функция отправки фото в Telegram
async function sendPhotoToTelegram(photoBase64, topicId, caption = '') {
    try {
        // Преобразуем base64 в blob
        const response = await fetch(`data:image/jpeg;base64,${photoBase64}`);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('chat_id', telegramConfig.staffChatId);
        formData.append('message_thread_id', topicId);
        formData.append('photo', blob, 'photo.jpg');
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');

        const photoResponse = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendPhoto`, {
            method: 'POST',
            body: formData
        });

        const result = await photoResponse.json();

        if (!result.ok) {
            console.error('Ошибка отправки фото в Telegram:', result);
            throw new Error('Не удалось отправить фото в Telegram');
        }

        return result;
    } catch (error) {
        console.error('Ошибка отправки фото в Telegram:', error);
        throw error;
    }
}

function sendPendingSubmissions() {
    const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
    if (pending.length === 0) return;

    const successfulSubmissions = [];

    for (const data of pending) {
        try {
            tg.sendData(JSON.stringify(data));
            console.log('Отправлен отложенный запрос:', data);
            successfulSubmissions.push(data);
        } catch (error) {
            console.error('Ошибка отправки отложенного запроса:', error);
        }
    }

    // Удаляем успешно отправленные
    const updatedPending = pending.filter(sub => !successfulSubmissions.includes(sub));
    localStorage.setItem('pending_submissions', JSON.stringify(updatedPending));
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
            <h3 style="margin-bottom: 10px;">Учет работ v2.3.0</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                Приложение для учета работ по установке и обслуживанию тахографов
            </p>
            <div style="background: var(--light-bg); padding: 15px; border-radius: 10px; margin-top: 20px;">
                <p style="margin-bottom: 5px;"><strong>📱 Интеграция с Telegram:</strong></p>
                <p style="margin-bottom: 5px;">• Отправка записей в топик #7</p>
                <p style="margin-bottom: 5px;">• Отправка фотоотчетов в топик #7</p>
                <p style="margin-bottom: 5px;">• Отправка поверок ТАХО в топик #270</p>
                <p><strong>Новая система сдачи работ:</strong></p>
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
                <p><strong>Сдача работ с полными данными:</strong></p>
                <p style="margin-bottom: 5px;">• Ввод данных организации при сдаче</p>
                <p style="margin-bottom: 5px;">• Отправка всех данных в Telegram чат</p>
                <p style="margin-bottom: 5px;">• Фотоотчеты с описанием</p>
                <p><strong>Редактирование записей:</strong></p>
                <p style="margin-bottom: 5px;">• Изменение всех данных записи</p>
                <p style="margin-bottom: 5px;">• Удаление записей</p>
                <p><strong>Дата сборки:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                <p><strong>Telegram Chat ID:</strong> ${telegramConfig.staffChatId}</p>
            </div>
        </div>
    `);
}

// Экспорт функций
window.setupTheme = setupTheme;
window.goBack = goBack;
window.handleMenuAction = handleMenuAction;
window.sendToBot = sendToBot;
window.sendAppointmentToTelegram = sendAppointmentToTelegram;
window.sendWorkReportToTelegram = sendWorkReportToTelegram;
window.sendVerificationToTelegram = sendVerificationToTelegram;
window.sendMessageToTelegram = sendMessageToTelegram;
window.sendPhotoToTelegram = sendPhotoToTelegram;
window.sendPendingSubmissions = sendPendingSubmissions;
window.exportData = exportData;
window.clearData = clearData;
window.showAbout = showAbout;