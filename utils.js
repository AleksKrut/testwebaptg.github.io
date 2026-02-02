// Утилиты и вспомогательные функции

// Глобальные переменные
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
    selectedWorkType: null,
    pendingWorks: [],
    selectedWork: null,
    photos: [],
    mtInstallData: {
        vehicleBrand: '',
        vehicleModel: '',
        vehicleNumber: '',
        mtBrand: '',
        mtNumber: '',
        skziNumber: '',
        photoTypes: {
            simCard: false,
            mtId: false,
            mtLocation: false,
            fuseBoxSeal: false,
            mtSeal1: false,
            mtSeal2: false
        }
    },
    tahoWorkData: null,
    simpleDiagnosticData: null,
    selectedRecord: null
};

// Конфигурация услуг для клиентов
const clientServices = {
    'its': [
        {
            id: 'mt_install',
            name: 'Монтаж МТ',
            icon: 'fas fa-wrench',
            description: 'Работы по монтажу мониторинга транспорта'
        },
        {
            id: 'mt_diagnostic',
            name: 'Диагностика МТ',
            icon: 'fas fa-stethoscope',
            description: 'Диагностика мониторинга транспорта'
        },
        {
            id: 'asn_install',
            name: 'Монтаж АСН',
            icon: 'fas fa-satellite-dish',
            description: 'Работы по монтажу системы навигации'
        },
        {
            id: 'asn_diagnostic',
            name: 'Диагностика АСН',
            icon: 'fas fa-stethoscope',
            description: 'Диагностика системы навигации'
        },
        {
            id: 'taho_install',
            name: 'Монтаж ТАХО',
            icon: 'fas fa-tachometer-alt',
            description: 'Работы по установке тахографов',
            hasSubmenu: false,
            categories: ['Монтаж', 'Демонтаж', 'Диагностика', 'Поверка']
        },
        {
            id: 'taho_diagnostic',
            name: 'Диагностика ТАХО',
            icon: 'fas fa-stethoscope',
            description: 'Диагностика тахографов',
            hasSubmenu: false
        },
        {
            id: 'taho_demount',
            name: 'Демонтаж ТАХО',
            icon: 'fas fa-tachometer-alt',
            description: 'Работы по демонтажу тахографов'
        },
        {
            id: 'taho_diagnostic',
            name: 'Диагностика ТАХО',
            icon: 'fas fa-stethoscope',
            description: 'Диагностика тахографов'
        }
    ],
    'skai': [
        {
            id: 'mt_install',
            name: 'Монтаж МТ',
            icon: 'fas fa-wrench',
            description: 'Работы по монтажу мониторинга транспорта'
        },
        {
            id: 'diagnostic',
            name: 'Диагностика',
            icon: 'fas fa-stethoscope',
            description: 'Диагностические работы любой техники'
        }
    ],
    'tt': [
        {
            id: 'mt_install',
            name: 'Монтаж МТ',
            icon: 'fas fa-wrench',
            description: 'Работы по монтажу мониторинга транспорта'
        },
        {
            id: 'diagnostic',
            name: 'Диагностика',
            icon: 'fas fa-stethoscope',
            description: 'Диагностические работы любой техники'
        }
    ],
    'citypoint': [
        {
            id: 'mt_install',
            name: 'Монтаж МТ',
            icon: 'fas fa-wrench',
            description: 'Работы по монтажу мониторинга транспорта'
        },
        {
            id: 'diagnostic',
            name: 'Диагностика',
            icon: 'fas fa-stethoscope',
            description: 'Диагностические работы любой техники'
        }
    ]
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
    modalClose: document.getElementById('modal-close'),
    loadingOverlay: document.getElementById('loading-overlay')
};

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
        'mt_diagnostic': 'Диагностика МТ',
        'asn_install': 'Монтаж АСН',
        'asn_diagnostic': 'Диагностика АСН',
        'taho_install': 'Монтаж ТАХО',
        'taho_demount': 'Демонтаж ТАХО',
        'taho_diagnostic': 'Диагностика ТАХО',
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

function updateRecordCount() {
    const count = appState.records.length;
    elements.recordCount.textContent = `Записей: ${count}`;
}

function showLoading(message = 'Загрузка...') {
    const loadingText = elements.loadingOverlay.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = message;
    }
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

function showModal(title, content) {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = content;
    elements.modalOverlay.style.display = 'flex';
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}

function closeModal() {
    elements.modalOverlay.style.display = 'none';
}

// Экспорт глобальных переменных и функций
window.appState = appState;
window.clientServices = clientServices;
window.elements = elements;
window.tg = tg;

window.getClientName = getClientName;
window.getServiceName = getServiceName;
window.getTahoSubserviceName = getTahoSubserviceName;
window.getServiceDisplayName = getServiceDisplayName;
window.formatDate = formatDate;
window.updateCurrentDate = updateCurrentDate;
window.updateRecordCount = updateRecordCount;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showModal = showModal;
window.closeModal = closeModal;