// Конфигурация Telegram
const telegramConfig = {
    botToken: '8097123061:AAE1MEwgww68pHJeo1V2xHMvPR-b-Epxh4w',

    adminIds: [310221229],
    employeeIds: [7815039527, 5538838547, 456575064],

    staffChatId: -1002696349013,
    staffChatTopicId: 22,
    submissionTopicId: 7,
    tahoVerificationTopicId: 270,

    maxPhotosPerReport: 5,
    photoQuality: 0.8,

    maxRetryAttempts: 3,
    retryDelay: 5000
};

const appConfig = {
    version: '2.3.0',
    buildDate: '2024',
    maxRecords: 1000,
    maxPhotoSize: 10 * 1024 * 1024,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
};

function getTopicForAction(action, clientId = null) {
    switch(action) {
        case 'appointment':
        case 'submit_complete_work_report':
            return telegramConfig.submissionTopicId;

        case 'verification':
            return telegramConfig.tahoVerificationTopicId;

        case 'general':
            return telegramConfig.staffChatTopicId;

        default:
            return telegramConfig.submissionTopicId;
    }
}

function formatAppointmentMessage(record) {
    const dateStr = new Date(record.date).toLocaleDateString('ru-RU');
    let message = `📝 <b>НОВАЯ ЗАПИСЬ КЛИЕНТА</b>\n\n`;
    message += `<b>👤 Клиент:</b> ${getClientName(record.client)}\n`;

    if (record.service) {
        message += `<b>🔧 Услуга:</b> ${getServiceName(record.service, record.subservice)}\n`;
    }

    message += `<b>📅 Дата:</b> ${dateStr} ${record.time}\n`;
    message += `<b>🏢 Организация:</b> ${record.organization}\n`;
    
    // Добавляем информацию о представителе только если он известен
    if (record.contactUnknown) {
        message += `<b>👨‍💼 Представитель:</b> Неизвестен\n`;
    } else {
        message += `<b>👨‍💼 Представитель:</b> ${record.contactPerson}\n`;
        message += `<b>📞 Телефон:</b> ${record.phone}\n`;
    }

    if (record.vehicleUnknown) {
        message += `<b>🚗 Номер ТС:</b> Неизвестен\n`;
    } else if (record.vehicleNumber) {
        message += `<b>🚗 Номер ТС:</b> ${record.vehicleNumber}\n`;
    }

    if (record.comment) {
        message += `<b>💬 Комментарий:</b> ${record.comment}\n`;
    }

    message += `\n🆔 <b>ID записи:</b> ${record.id}\n`;
    message += `⏰ <b>Создано:</b> ${new Date().toLocaleString('ru-RU')}`;

    return message;
}

function formatWorkReportMessage(reportData) {
    let message = `📋 <b>СДАЧА РАБОТЫ</b>\n\n`;
    message += `<b>👤 Клиент:</b> ${getClientName(reportData.client)}\n`;
    message += `<b>🔧 Тип работы:</b> ${getServiceDisplayName(reportData.service_type)}\n`;
    message += `<b>🏢 Организация:</b> ${reportData.organization}\n`;
    
    // Добавляем информацию о представителе только если он известен
    if (reportData.contact_unknown) {
        message += `<b>👨‍💼 Представитель:</b> Неизвестен\n`;
    } else {
        message += `<b>👨‍💼 Представитель:</b> ${reportData.contact_person}\n`;
        message += `<b>📞 Телефон:</b> ${reportData.phone}\n`;
    }
    
    message += `<b>📅 Дата:</b> ${reportData.date} ${reportData.time}\n`;

    if (reportData.vehicle_unknown) {
        message += `<b>🚗 Номер ТС:</b> Неизвестен\n`;
    } else if (reportData.vehicle_number) {
        message += `<b>🚗 Номер ТС:</b> ${reportData.vehicle_number}\n`;
    }

    if (reportData.record_comment) {
        message += `<b>📝 Комментарий из записи:</b> ${reportData.record_comment}\n`;
    }

    if (reportData.comment) {
        message += `<b>💬 Комментарий к фотоотчету:</b> ${reportData.comment}\n`;
    }

    if (reportData.work_data) {
        if (reportData.work_data.type === 'mt_install') {
            message += `\n<b>📱 ДАННЫЕ МТ:</b>\n`;
            message += `<b>Марка ТС:</b> ${reportData.work_data.data.vehicleBrand} ${reportData.work_data.data.vehicleModel}\n`;
            message += `<b>Марка МТ:</b> ${reportData.work_data.data.mtBrand}\n`;
            message += `<b>Номер МТ:</b> ${reportData.work_data.data.mtNumber}\n`;
            // Убрали СКЗИ из МТ

            const selectedPhotos = [];
            if (reportData.work_data.data.photoTypes.simCard) selectedPhotos.push('Сим карта');
            if (reportData.work_data.data.photoTypes.mtId) selectedPhotos.push('ID МТ');
            if (reportData.work_data.data.photoTypes.mtLocation) selectedPhotos.push('Место установки МТ');
            if (reportData.work_data.data.photoTypes.fuseBoxSeal) selectedPhotos.push('Пломбка колодки предохранителей');
            if (reportData.work_data.data.photoTypes.mtSeal1) selectedPhotos.push('Пломба МТ 1');
            if (reportData.work_data.data.photoTypes.mtSeal2) selectedPhotos.push('Пломба МТ 2');

            message += `<b>📸 Сфотографировано:</b> ${selectedPhotos.join(', ')}\n`;
        } else if (reportData.work_data.type === 'taho') {
            message += `\n<b>📱 ДАННЫЕ ТАХО:</b>\n`;
            message += `<b>Категория:</b> ${reportData.work_data.category === 'mount' ? 'Монтаж' : 
                                            reportData.work_data.category === 'demount' ? 'Демонтаж' :
                                            reportData.work_data.category === 'diagnostic' ? 'Диагностика' : 'Поверка'}\n`;
            message += `<b>Марка ТС:</b> ${reportData.work_data.data.vehicleBrand} ${reportData.work_data.data.vehicleModel}\n`;
            message += `<b>Марка ТАХО:</b> ${reportData.work_data.data.tahoBrand}\n`;
            message += `<b>Номер ТАХО:</b> ${reportData.work_data.data.tahoNumber}\n`;
            message += `<b>СКЗИ:</b> ${reportData.work_data.data.skziNumber}\n`; // Оставляем СКЗИ только для ТАХО

            const selectedPhotos = [];
            if (reportData.work_data.data.photoTypes.tahoLabel) selectedPhotos.push('Шильдик ТАХО');
            if (reportData.work_data.data.photoTypes.skziCertificate) selectedPhotos.push('Сертификат СКЗИ');
            if (reportData.work_data.data.photoTypes.wheelBrand) selectedPhotos.push('Марка колеса');
            if (reportData.work_data.data.photoTypes.mileage) selectedPhotos.push('Пробег');
            if (reportData.work_data.data.photoTypes.pps) selectedPhotos.push('ППС');
            if (reportData.work_data.data.photoTypes.ds) selectedPhotos.push('ДС');

            message += `<b>📸 Сфотографировано:</b> ${selectedPhotos.join(', ')}\n`;
        } else if (reportData.work_data.type === 'diagnostic') {
            message += `\n<b>🔧 ДАННЫЕ ДИАГНОСТИКИ:</b>\n`;
            message += `<b>Марка ТС:</b> ${reportData.work_data.data.vehicleBrand} ${reportData.work_data.data.vehicleModel}\n`;
            message += `<b>Гос. номер:</b> ${reportData.work_data.data.vehicleNumber}\n`;
            if (reportData.work_data.data.partNumber) {
                message += `<b>Номер З-Н:</b> ${reportData.work_data.data.partNumber}\n`;
            }
        }
    }

    message += `\n<b>📸 Прикреплено фото:</b> ${reportData.photos.length}`;
    message += `\n🆔 <b>ID записи:</b> ${reportData.record_id}`;
    message += `\n⏰ <b>Отправлено:</b> ${new Date().toLocaleString('ru-RU')}`;

    return message;
}

function formatVerificationMessage(verificationData) {
    let message = `📋 <b>ПОВЕРКА ТАХОГРАФА</b>\n\n`;
    message += `<b>🔢 Номер ТАХО:</b> ${verificationData.taho_number}\n`;
    message += `<b>📅 Дата последней поверки:</b> ${verificationData.last_verification_date}\n`;
    message += `<b>📅 Дата следующей поверки:</b> ${verificationData.next_verification_date}\n`;
    message += `<b>🏢 Организация:</b> ${verificationData.organization}\n`;
    message += `<b>📊 Результат:</b> ${verificationData.result === 'passed' ? '✅ Пройдена успешно' : 
                                       verificationData.result === 'failed' ? '❌ Не пройдена' : 
                                       '⚠️ Условно пройдена'}\n`;

    if (verificationData.comment) {
        message += `<b>💬 Комментарий:</b> ${verificationData.comment}\n`;
    }

    message += `\n⏰ <b>Отправлено:</b> ${new Date().toLocaleString('ru-RU')}`;

    return message;
}

window.telegramConfig = telegramConfig;
window.appConfig = appConfig;
window.getTopicForAction = getTopicForAction;
window.formatAppointmentMessage = formatAppointmentMessage;
window.formatWorkReportMessage = formatWorkReportMessage;
window.formatVerificationMessage = formatVerificationMessage;