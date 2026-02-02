// Конфигурация Telegram
const telegramConfig = {
    // Вставьте ваш токен бота здесь
    botToken: '8097123061:AAE1MEwgww68pHJeo1V2xHMvPR-b-Epxh4w',

    // ID чатов для разных клиентов
    chats: {
        'its': '-1002696349013',      // Замените на реальный ID чата для ИТС
        'skai': '-1001234567891',     // Замените на реальный ID чата для SKAI
        'tt': '-1001234567892',       // Замените на реальный ID чата для ТТ
        'citypoint': '-1001234567893' // Замените на реальный ID чата для CityPoint
    },

    // ID чата для административных уведомлений
    adminChatId: '310221229',

    // Настройки отправки фото
    maxPhotosPerReport: 5,
    photoQuality: 0.8,

    // Настройки повторных попыток
    maxRetryAttempts: 3,
    retryDelay: 5000 // 5 секунд
};

// Глобальные настройки приложения
const appConfig = {
    version: '2.2.0',
    buildDate: '2024',
    maxRecords: 1000,
    maxPhotoSize: 10 * 1024 * 1024, // 10MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
};

// Экспорт конфигурации
window.telegramConfig = telegramConfig;
window.appConfig = appConfig;

// Функция для получения конфигурации клиента
function getClientConfig(clientId) {
    return {
        chatId: telegramConfig.chats[clientId] || telegramConfig.chats.its,
        clientName: getClientName(clientId)
    };
}

// Функция для проверки конфигурации
function validateConfig() {
    if (!telegramConfig.botToken || telegramConfig.botToken === 'ВАШ_ТОКЕН_БОТА') {
        console.warn('Токен бота не настроен. Замените ВАШ_ТОКЕН_БОТА на реальный токен.');
        return false;
    }

    // Проверяем, что все чаты настроены
    const clients = ['its', 'skai', 'tt', 'citypoint'];
    const missingChats = clients.filter(client => !telegramConfig.chats[client]);

    if (missingChats.length > 0) {
        console.warn('Не настроены чаты для клиентов:', missingChats);
    }

    return true;
}

// Экспорт функций
window.getClientConfig = getClientConfig;
window.validateConfig = validateConfig;