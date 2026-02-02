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
    } catch (error) {
        console.error('Ошибка отправки данных записи в бот:', error);
        const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
        pending.push(data);
        localStorage.setItem('pending_submissions', JSON.stringify(pending));
    }
}

async function sendWorkReportToTelegram(reportData) {
    try {
        // Конфигурация чатов для разных клиентов
        const chatConfig = {
            'its': '-1001234567890', // ID чата для ИТС
            'skai': '-1001234567891', // ID чата для SKAI
            'tt': '-1001234567892', // ID чата для ТТ
            'citypoint': '-1001234567893' // ID чата для CityPoint
        };

        // В реальном приложении используйте ваш токен бота
        const botToken = 'ВАШ_ТОКЕН_БОТА';
        const chatId = chatConfig[reportData.client] || '-1001234567890';

        // Формируем текст сообщения
        let messageText = `📋 <b>НОВАЯ СДАЧА РАБОТЫ</b>\n\n`;
        messageText += `<b>👤 Клиент:</b> ${getClientName(reportData.client)}\n`;
        messageText += `<b>🔧 Тип работы:</b> ${getServiceDisplayName(reportData.service_type)}\n`;
        messageText += `<b>🏢 Организация:</b> ${reportData.organization}\n`;
        messageText += `<b>👨‍💼 Представитель:</b> ${reportData.contact_person}\n`;
        messageText += `<b>📞 Телефон:</b> ${reportData.phone}\n`;
        messageText += `<b>📅 Дата:</b> ${reportData.date} ${reportData.time}\n`;

        if (reportData.vehicle_unknown) {
            messageText += `<b>🚗 Номер ТС:</b> Неизвестен\n`;
        } else if (reportData.vehicle_number) {
            messageText += `<b>🚗 Номер ТС:</b> ${reportData.vehicle_number}\n`;
        }

        if (reportData.record_comment) {
            messageText += `<b>📝 Комментарий из записи:</b> ${reportData.record_comment}\n`;
        }

        if (reportData.comment) {
            messageText += `<b>💬 Комментарий к фотоотчету:</b> ${reportData.comment}\n`;
        }

        // Данные специфичные для типа работы
        if (reportData.work_data) {
            if (reportData.work_data.type === 'mt_install') {
                messageText += `\n<b>📱 ДАННЫЕ МТ:</b>\n`;
                messageText += `<b>Марка ТС:</b> ${reportData.work_data.data.vehicleBrand} ${reportData.work_data.data.vehicleModel}\n`;
                messageText += `<b>Марка МТ:</b> ${reportData.work_data.data.mtBrand}\n`;
                messageText += `<b>Номер МТ:</b> ${reportData.work_data.data.mtNumber}\n`;
                messageText += `<b>СКЗИ:</b> ${reportData.work_data.data.skziNumber}\n`;

                // Информация о фотографиях
                const selectedPhotos = [];
                if (reportData.work_data.data.photoTypes.simCard) selectedPhotos.push('Сим карта');
                if (reportData.work_data.data.photoTypes.mtId) selectedPhotos.push('ID МТ');
                if (reportData.work_data.data.photoTypes.mtLocation) selectedPhotos.push('Место установки МТ');
                if (reportData.work_data.data.photoTypes.fuseBoxSeal) selectedPhotos.push('Пломбка колодки предохранителей');
                if (reportData.work_data.data.photoTypes.mtSeal1) selectedPhotos.push('Пломба МТ 1');
                if (reportData.work_data.data.photoTypes.mtSeal2) selectedPhotos.push('Пломба МТ 2');

                messageText += `<b>📸 Сфотографировано:</b> ${selectedPhotos.join(', ')}\n`;
            } else if (reportData.work_data.type === 'taho') {
                messageText += `\n<b>📱 ДАННЫЕ ТАХО:</b>\n`;
                messageText += `<b>Категория:</b> ${reportData.work_data.category === 'mount' ? 'Монтаж' : 
                                                    reportData.work_data.category === 'demount' ? 'Демонтаж' :
                                                    reportData.work_data.category === 'diagnostic' ? 'Диагностика' : 'Поверка'}\n`;
                messageText += `<b>Марка ТС:</b> ${reportData.work_data.data.vehicleBrand} ${reportData.work_data.data.vehicleModel}\n`;
                messageText += `<b>Марка ТАХО:</b> ${reportData.work_data.data.tahoBrand}\n`;
                messageText += `<b>Номер ТАХО:</b> ${reportData.work_data.data.tahoNumber}\n`;
                messageText += `<b>СКЗИ:</b> ${reportData.work_data.data.skziNumber}\n`;

                // Информация о фотографиях
                const selectedPhotos = [];
                if (reportData.work_data.data.photoTypes.tahoLabel) selectedPhotos.push('Шильдик ТАХО');
                if (reportData.work_data.data.photoTypes.skziCertificate) selectedPhotos.push('Сертификат СКЗИ');
                if (reportData.work_data.data.photoTypes.wheelBrand) selectedPhotos.push('Марка колеса');
                if (reportData.work_data.data.photoTypes.mileage) selectedPhotos.push('Пробег');
                if (reportData.work_data.data.photoTypes.pps) selectedPhotos.push('ППС');
                if (reportData.work_data.data.photoTypes.ds) selectedPhotos.push('ДС');

                messageText += `<b>📸 Сфотографировано:</b> ${selectedPhotos.join(', ')}\n`;
            } else if (reportData.work_data.type === 'diagnostic') {
                messageText += `\n<b>🔧 ДАННЫЕ ДИАГНОСТИКИ:</b>\n`;
                messageText += `<b>Марка ТС:</b> ${reportData.work_data.data.vehicleBrand} ${reportData.work_data.data.vehicleModel}\n`;
                messageText += `<b>Гос. номер:</b> ${reportData.work_data.data.vehicleNumber}\n`;
                if (reportData.work_data.data.partNumber) {
                    messageText += `<b>Номер З-Н:</b> ${reportData.work_data.data.partNumber}\n`;
                }
            }
        }

        messageText += `\n<b>📸 Прикреплено фото:</b> ${reportData.photos.length}`;
        messageText += `\n\n🆔 <b>ID записи:</b> ${reportData.record_id}`;

        // Отправка текстового сообщения
        const textResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: messageText,
                parse_mode: 'HTML'
            })
        });

        const textResult = await textResponse.json();

        if (!textResult.ok) {
            console.error('Ошибка отправки текста в Telegram:', textResult);
            throw new Error('Не удалось отправить сообщение в Telegram');
        }

        // Отправка фото (ограничим 5 фото, чтобы не перегружать)
        if (reportData.photos && reportData.photos.length > 0) {
            for (let i = 0; i < Math.min(reportData.photos.length, 5); i++) {
                const photoData = reportData.photos[i];

                try {
                    // Для Base64 фото
                    const formData = new FormData();

                    // Преобразуем base64 в blob
                    const response = await fetch(`data:image/jpeg;base64,${photoData}`);
                    const blob = await response.blob();

                    formData.append('photo', blob, `photo_${i + 1}.jpg`);
                    formData.append('chat_id', chatId);
                    formData.append('caption', i === 0 ? 'Фотоотчет к работе' : `Фото ${i + 1}`);

                    await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                        method: 'POST',
                        body: formData
                    });

                    // Пауза между отправками
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (photoError) {
                    console.error(`Ошибка отправки фото ${i + 1}:`, photoError);
                }
            }
        }

        console.log('Отчет успешно отправлен в Telegram чат');
        return true;
    } catch (error) {
        console.error('Ошибка отправки отчета в Telegram чат:', error);

        // Сохраняем в локальное хранилище для повторной отправки
        const pendingReports = JSON.parse(localStorage.getItem('pending_work_reports') || '[]');
        pendingReports.push({
            data: reportData,
            timestamp: new Date().toISOString(),
            retryCount: 0
        });
        localStorage.setItem('pending_work_reports', JSON.stringify(pendingReports));

        throw error;
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

async function retryPendingWorkReports() {
    const pendingReports = JSON.parse(localStorage.getItem('pending_work_reports') || '[]');
    if (pendingReports.length === 0) return;

    const successfulReports = [];

    for (const report of pendingReports) {
        try {
            // Ограничим количество попыток
            if (report.retryCount >= 3) {
                console.log('Превышено количество попыток для отчета:', report.data.record_id);
                continue;
            }

            await sendWorkReportToTelegram(report.data);
            successfulReports.push(report);
        } catch (error) {
            console.error('Не удалось повторно отправить отчет:', error);

            // Увеличиваем счетчик попыток
            report.retryCount = (report.retryCount || 0) + 1;
        }
    }

    // Удаляем успешно отправленные отчеты
    const updatedReports = pendingReports.filter(report =>
        !successfulReports.includes(report)
    );

    localStorage.setItem('pending_work_reports', JSON.stringify(updatedReports));
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
            <h3 style="margin-bottom: 10px;">Учет работ v2.2.0</h3>
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
                <p><strong>Сдача работ с полными данными:</strong></p>
                <p style="margin-bottom: 5px;">• Ввод данных организации при сдаче</p>
                <p style="margin-bottom: 5px;">• Отправка всех данных в Telegram чат</p>
                <p style="margin-bottom: 5px;">• Фотоотчеты с описанием</p>
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
window.sendWorkReportToTelegram = sendWorkReportToTelegram;
window.sendPendingSubmissions = sendPendingSubmissions;
window.retryPendingWorkReports = retryPendingWorkReports;
window.exportData = exportData;
window.clearData = clearData;
window.showAbout = showAbout;