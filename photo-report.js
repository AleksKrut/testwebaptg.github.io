// Функции для фотоотчета

function showServiceTypeSelection() {
    appState.currentPage = 'service-type-selection';
    appState.history.push('main');

    appState.selectedWorkType = null;
    appState.pendingWorks = [];
    appState.selectedWork = null;
    appState.photos = [];
    appState.mtInstallData = {
        vehicleBrand: '',
        vehicleModel: '',
        vehicleNumber: '',
        mtBrand: '',
        mtNumber: '',
        photoTypes: {
            simCard: false,
            mtId: false,
            mtLocation: false,
            fuseBoxSeal: false,
            mtSeal1: false,
            mtSeal2: false
        }
    };
    appState.tahoWorkData = null;
    appState.simpleDiagnosticData = null;

    elements.pageTitle.textContent = 'Сдать работу';
    elements.backBtn.style.display = 'flex';
    elements.mainMenu.style.display = 'none';

    const serviceTypes = [
        {
            id: 'mt_install',
            name: 'Монтаж МТ',
            icon: 'fas fa-wrench',
            description: 'Работы по монтажу мониторинга транспорта',
            colorClass: 'service-type-mt'
        },
        {
            id: 'asn_install',
            name: 'Монтаж АСН',
            icon: 'fas fa-satellite-dish',
            description: 'Работы по монтажу системы навигации',
            colorClass: 'service-type-asn'
        },
        {
            id: 'taho_install',
            name: 'Монтаж ТАХО',
            icon: 'fas fa-tachometer-alt',
            description: 'Работы по установке тахографов',
            colorClass: 'service-type-taho'
        },
        {
            id: 'taho_diagnostic',
            name: 'Диагностика ТАХО',
            icon: 'fas fa-stethoscope',
            description: 'Диагностика тахографов',
            colorClass: 'service-type-taho'
        },
        {
            id: 'diagnostic',
            name: 'Диагностика',
            icon: 'fas fa-stethoscope',
            description: 'Диагностические работы любой техники',
            colorClass: 'service-type-diagnostic'
        }
    ];

    let html = `
        <div class="service-type-container">
            <p style="margin-bottom: 20px; color: var(--text-secondary);">
                Выберите тип работы, которую хотите сдать:
            </p>
            
            <div class="service-type-grid">
    `;

    serviceTypes.forEach(service => {
        const isSelected = appState.selectedWorkType === service.id;
        const itemClass = isSelected ? 'service-type-item selected' : 'service-type-item';

        html += `
            <div class="${itemClass}" data-service="${service.id}">
                <div class="service-type-icon ${service.colorClass}">
                    <i class="${service.icon}"></i>
                </div>
                <div class="service-type-name">${service.name}</div>
                <div class="service-type-desc">${service.description}</div>
            </div>
        `;
    });

    html += `
            </div>
            
            <button class="btn btn-primary" id="select-service-btn" style="margin-top: 20px;" disabled>
                <i class="fas fa-arrow-right btn-icon"></i>
                Далее
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    document.querySelectorAll('.service-type-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.service-type-item').forEach(el => {
                el.classList.remove('selected');
            });

            item.classList.add('selected');
            appState.selectedWorkType = item.dataset.service;

            document.getElementById('select-service-btn').disabled = false;
        });
    });

    document.getElementById('select-service-btn').addEventListener('click', () => {
        loadPendingWorks();
    });
}

async function loadPendingWorks() {
    showLoading('Загрузка списка работ...');

    try {
        const data = {
            action: 'get_pending_works',
            service_type: appState.selectedWorkType
        };

        tg.sendData(JSON.stringify(data));

        const pendingWorks = appState.records.filter(record =>
            record.service === appState.selectedWorkType &&
            record.status === 'pending'
        );

        appState.pendingWorks = pendingWorks;

        hideLoading();

        if (pendingWorks.length === 0) {
            showModal(
                'Нет работ для сдачи',
                `По типу работы "${getServiceDisplayName(appState.selectedWorkType)}" нет работ, ожидающих фотоотчета.<br><br>
                 Создайте новые записи через меню "Записать клиента".`
            );
            setTimeout(() => {
                closeModal();
                showServiceTypeSelection();
            }, 3000);
            return;
        }

        showWorkList();

    } catch (error) {
        hideLoading();
        console.error('Error loading pending works:', error);
        tg.showAlert('Ошибка при загрузке списка работ');
    }
}

function showWorkList() {
    appState.currentPage = 'work-list';
    appState.history.push('service-type-selection');

    const serviceName = getServiceDisplayName(appState.selectedWorkType);
    elements.pageTitle.textContent = `Выберите работу - ${serviceName}`;

    let html = `
        <div class="work-list-container">
            <p style="margin-bottom: 20px; color: var(--text-secondary);">
                Выберите работу для прикрепления фотоотчета:
            </p>
            
            <div id="works-list">
    `;

    if (appState.pendingWorks.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-clipboard-list" style="font-size: 48px; color: var(--text-secondary); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">Нет работ для сдачи</h3>
                <p style="color: var(--text-secondary);">Создайте новые записи через меню "Записать клиента"</p>
            </div>
        `;
    } else {
        appState.pendingWorks.forEach((work, index) => {
            const isSelected = appState.selectedWork && appState.selectedWork.id === work.id;
            const workClass = isSelected ? 'work-item selected' : 'work-item';
            const dateStr = new Date(work.date).toLocaleDateString('ru-RU');

            html += `
                <div class="${workClass}" data-work-id="${work.id}">
                    <div class="work-header">
                        <div class="work-client">${getClientName(work.client)}</div>
                        <div class="work-date">${dateStr} ${work.time}</div>
                    </div>
                    
                    ${work.organization ? `
                        <div class="work-details">
                            <i class="fas fa-building"></i> ${work.organization}
                        </div>
                    ` : ''}
                    
                    ${work.contactPerson && !work.contactUnknown ? `
                        <div class="work-details">
                            <i class="fas fa-user"></i> ${work.contactPerson}
                        </div>
                    ` : ''}
                    
                    ${work.contactUnknown ? `
                        <div class="work-details">
                            <i class="fas fa-user"></i> Представитель: Неизвестен
                        </div>
                    ` : ''}
                    
                    ${work.phone && !work.contactUnknown ? `
                        <div class="work-details">
                            <i class="fas fa-phone"></i> ${work.phone}
                        </div>
                    ` : ''}
                    
                    ${work.vehicleUnknown ? `
                        <div class="work-details">
                            <i class="fas fa-car"></i> Номер ТС неизвестен
                        </div>
                    ` : ''}
                    
                    ${!work.vehicleUnknown && work.vehicleNumber ? `
                        <div class="work-details">
                            <i class="fas fa-car"></i> ${work.vehicleNumber}
                        </div>
                    ` : ''}
                    
                    ${work.comment ? `
                        <div class="work-details">
                            <i class="fas fa-comment"></i> ${work.comment.substring(0, 50)}...
                        </div>
                    ` : ''}
                    
                    <div class="work-status status-pending">Ожидает фотоотчета</div>
                </div>
            `;
        });
    }

    html += `
            </div>
            
            <button class="btn btn-primary" id="select-work-btn" style="margin-top: 20px;" ${!appState.selectedWork ? 'disabled' : ''}>
                <i class="fas fa-camera btn-icon"></i>
                Прикрепить фотоотчет
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    document.querySelectorAll('.work-item').forEach(item => {
        item.addEventListener('click', () => {
            const workId = parseInt(item.dataset.workId);

            document.querySelectorAll('.work-item').forEach(el => {
                el.classList.remove('selected');
            });

            item.classList.add('selected');

            appState.selectedWork = appState.pendingWorks.find(work => work.id === workId);

            document.getElementById('select-work-btn').disabled = false;
        });
    });

    document.getElementById('select-work-btn').addEventListener('click', () => {
        // Сначала показываем форму с данными организации
        showOrganizationFormForWork();
    });
}

function showOrganizationFormForWork() {
    appState.currentPage = 'work-organization-form';
    appState.history.push('work-list');

    const clientName = getClientName(appState.selectedWork.client);
    const serviceName = getServiceDisplayName(appState.selectedWorkType);

    elements.pageTitle.textContent = `Данные организации - ${clientName}`;

    let html = `
        <div class="form-section">
            <div class="form-section-title">🏢 Данные организации для отчета</div>
            
            <div class="input-group">
                <label class="required">Организация</label>
                <input type="text" class="form-input" id="work-organization" 
                       placeholder="Введите название организации" 
                       value="${appState.selectedWork.organization || ''}">
                <div class="error-message" id="work-organization-error">Пожалуйста, введите название организации</div>
            </div>
            
            <div class="checkbox-group" style="margin-top: 15px;">
                <input type="checkbox" id="work-contact-unknown" ${appState.selectedWork.contactUnknown ? 'checked' : ''}>
                <label for="work-contact-unknown" style="margin-left: 8px; font-size: 14px;">
                    Представитель неизвестен
                </label>
            </div>
            
            <div id="work-contact-fields" style="${appState.selectedWork.contactUnknown ? 'display: none;' : ''}">
                <div class="input-group">
                    <label class="required">Представитель</label>
                    <input type="text" class="form-input" id="work-contact-person" 
                           placeholder="ФИО представителя" 
                           value="${appState.selectedWork.contactPerson || ''}">
                    <div class="error-message" id="work-contact-person-error">Пожалуйста, введите ФИО представителя</div>
                </div>
                
                <div class="input-group">
                    <label class="required">Телефон</label>
                    <input type="tel" class="form-input" id="work-phone" 
                           placeholder="+7 (999) 123-45-67" 
                           value="${appState.selectedWork.phone || ''}">
                    <div class="error-message" id="work-phone-error">Пожалуйста, введите корректный номер телефона</div>
                </div>
            </div>
        </div>
        
        <button class="btn btn-primary" id="continue-to-work-form">
            <i class="fas fa-arrow-right btn-icon"></i>
            Продолжить
        </button>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    document.getElementById('continue-to-work-form').addEventListener('click', () => {
        if (validateWorkOrganizationForm()) {
            const contactUnknown = document.getElementById('work-contact-unknown').checked;
            
            // Сохраняем данные организации для отчета
            appState.selectedWork.organization = document.getElementById('work-organization').value.trim();
            appState.selectedWork.contactPerson = contactUnknown ? '' : document.getElementById('work-contact-person').value.trim();
            appState.selectedWork.phone = contactUnknown ? '' : document.getElementById('work-phone').value.trim();
            appState.selectedWork.contactUnknown = contactUnknown;

            // Переходим к соответствующей форме работы
            if (appState.selectedWorkType === 'mt_install') {
                showMtInstallForm();
            } else if (appState.selectedWorkType === 'taho_install' || appState.selectedWorkType === 'taho_diagnostic') {
                showTahoWorkForm();
            } else if (appState.selectedWorkType === 'diagnostic' &&
                       (appState.selectedWork.client === 'skai' ||
                        appState.selectedWork.client === 'tt' ||
                        appState.selectedWork.client === 'citypoint')) {
                showSimpleDiagnosticForm();
            } else {
                showPhotoUpload();
            }
        }
    });

    document.getElementById('work-contact-unknown').addEventListener('change', function() {
        const contactFields = document.getElementById('work-contact-fields');
        const contactPersonInput = document.getElementById('work-contact-person');
        const phoneInput = document.getElementById('work-phone');
        
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

    document.getElementById('work-organization').addEventListener('input', validateWorkOrganizationForm);
    document.getElementById('work-contact-person').addEventListener('input', validateWorkOrganizationForm);
    document.getElementById('work-phone').addEventListener('input', validateWorkOrganizationForm);
}

function validateWorkOrganizationForm() {
    const organization = document.getElementById('work-organization').value.trim();
    const contactPerson = document.getElementById('work-contact-person').value.trim();
    const phone = document.getElementById('work-phone').value.trim();
    const contactUnknown = document.getElementById('work-contact-unknown').checked;

    let isValid = true;

    if (!organization) {
        document.getElementById('work-organization-error').style.display = 'block';
        document.getElementById('work-organization').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('work-organization-error').style.display = 'none';
        document.getElementById('work-organization').classList.remove('error');
    }

    if (!contactUnknown) {
        if (!contactPerson) {
            document.getElementById('work-contact-person-error').style.display = 'block';
            document.getElementById('work-contact-person').classList.add('error');
            isValid = false;
        } else {
            document.getElementById('work-contact-person-error').style.display = 'none';
            document.getElementById('work-contact-person').classList.remove('error');
        }

        const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
        if (!phone || !phoneRegex.test(phone.replace(/\D/g, ''))) {
            document.getElementById('work-phone-error').style.display = 'block';
            document.getElementById('work-phone').classList.add('error');
            isValid = false;
        } else {
            document.getElementById('work-phone-error').style.display = 'none';
            document.getElementById('work-phone').classList.remove('error');
        }
    }

    return isValid;
}

function showMtInstallForm() {
    appState.currentPage = 'mt-install-form';
    appState.history.push('work-organization-form');

    const clientName = getClientName(appState.selectedWork.client);
    elements.pageTitle.textContent = `Монтаж МТ - ${clientName}`;

    const vehicleNumber = appState.selectedWork.vehicleNumber && !appState.selectedWork.vehicleUnknown
        ? appState.selectedWork.vehicleNumber
        : '';

    let html = `
        <div class="mt-install-form-container">
            <div class="form-section">
                <div class="form-section-title">📋 Выберите, что будете фотографировать</div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-sim-card" ${appState.mtInstallData.photoTypes.simCard ? 'checked' : ''}>
                    <label for="photo-sim-card">Сим карта</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-mt-id" ${appState.mtInstallData.photoTypes.mtId ? 'checked' : ''}>
                    <label for="photo-mt-id">ID МТ</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-mt-location" ${appState.mtInstallData.photoTypes.mtLocation ? 'checked' : ''}>
                    <label for="photo-mt-location">Место установки МТ</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-fuse-box-seal" ${appState.mtInstallData.photoTypes.fuseBoxSeal ? 'checked' : ''}>
                    <label for="photo-fuse-box-seal">Пломбка колодки предохранителей</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-mt-seal-1" ${appState.mtInstallData.photoTypes.mtSeal1 ? 'checked' : ''}>
                    <label for="photo-mt-seal-1">Пломба МТ 1</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-mt-seal-2" ${appState.mtInstallData.photoTypes.mtSeal2 ? 'checked' : ''}>
                    <label for="photo-mt-seal-2">Пломба МТ 2</label>
                </div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">🚗 Данные транспортного средства</div>
                
                <div class="input-group">
                    <label class="required">Марка/модель ТС</label>
                    <input type="text" class="form-input" id="vehicle-brand-model" 
                           placeholder="Например: ГАЗель NEXT" 
                           value="${appState.mtInstallData.vehicleBrand} ${appState.mtInstallData.vehicleModel}">
                </div>
                
                <div class="input-group">
                    <label>Гос. номер ТС</label>
                    <input type="text" class="form-input" id="vehicle-number" 
                           placeholder="А123БВ777" 
                           value="${vehicleNumber || appState.mtInstallData.vehicleNumber}">
                    <p class="form-hint">Укажите, если не был указан при создании заявки</p>
                </div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">📱 Данные МТ</div>
                
                <div class="input-group">
                    <label class="required">Марка МТ</label>
                    <input type="text" class="form-input" id="mt-brand" 
                           placeholder="Например: Galileosky" 
                           value="${appState.mtInstallData.mtBrand}">
                </div>
                
                <div class="input-group">
                    <label class="required">Номер МТ</label>
                    <input type="text" class="form-input" id="mt-number" 
                           placeholder="Уникальный номер устройства" 
                           value="${appState.mtInstallData.mtNumber}">
                </div>
            </div>
            
            <button class="btn btn-primary" id="continue-to-photos-btn">
                <i class="fas fa-arrow-right btn-icon"></i>
                Перейти к загрузке фото
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    document.getElementById('continue-to-photos-btn').addEventListener('click', () => {
        const brandModel = document.getElementById('vehicle-brand-model').value.trim();
        const [brand, ...modelParts] = brandModel.split(' ');

        appState.mtInstallData = {
            vehicleBrand: brand || '',
            vehicleModel: modelParts.join(' ') || '',
            vehicleNumber: document.getElementById('vehicle-number').value.trim(),
            mtBrand: document.getElementById('mt-brand').value.trim(),
            mtNumber: document.getElementById('mt-number').value.trim(),
            photoTypes: {
                simCard: document.getElementById('photo-sim-card').checked,
                mtId: document.getElementById('photo-mt-id').checked,
                mtLocation: document.getElementById('photo-mt-location').checked,
                fuseBoxSeal: document.getElementById('photo-fuse-box-seal').checked,
                mtSeal1: document.getElementById('photo-mt-seal-1').checked,
                mtSeal2: document.getElementById('photo-mt-seal-2').checked
            }
        };

        if (!appState.mtInstallData.vehicleBrand || !appState.mtInstallData.mtBrand ||
            !appState.mtInstallData.mtNumber) {
            tg.showAlert('Пожалуйста, заполните все обязательные поля: Марка/модель ТС, Марка МТ, Номер МТ');
            return;
        }

        const hasSelectedPhotos = Object.values(appState.mtInstallData.photoTypes).some(value => value);
        if (!hasSelectedPhotos) {
            tg.showAlert('Пожалуйста, выберите хотя бы один пункт для фотографирования');
            return;
        }

        showMtPhotoUpload();
    });
}

function showMtPhotoUpload() {
    appState.currentPage = 'mt-photo-upload';
    appState.history.push('mt-install-form');

    const clientName = getClientName(appState.selectedWork.client);
    elements.pageTitle.textContent = `Фотоотчет МТ - ${clientName}`;

    const selectedPhotos = [];
    if (appState.mtInstallData.photoTypes.simCard) selectedPhotos.push('Сим карта');
    if (appState.mtInstallData.photoTypes.mtId) selectedPhotos.push('ID МТ');
    if (appState.mtInstallData.photoTypes.mtLocation) selectedPhotos.push('Место установки МТ');
    if (appState.mtInstallData.photoTypes.fuseBoxSeal) selectedPhotos.push('Пломбка колодки предохранителей');
    if (appState.mtInstallData.photoTypes.mtSeal1) selectedPhotos.push('Пломба МТ 1');
    if (appState.mtInstallData.photoTypes.mtSeal2) selectedPhotos.push('Пломба МТ 2');

    let html = `
        <div class="photo-upload-container">
            <div class="summary-item">
                <div class="summary-label">Тип работы:</div>
                <div class="summary-value">Монтаж МТ</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Клиент:</div>
                <div class="summary-value">${clientName}</div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">📋 Данные монтажа</div>
                <div class="summary-item">
                    <div class="summary-label">Марка/модель ТС:</div>
                    <div class="summary-value">${appState.mtInstallData.vehicleBrand} ${appState.mtInstallData.vehicleModel}</div>
                </div>
                ${appState.mtInstallData.vehicleNumber ? `
                <div class="summary-item">
                    <div class="summary-label">Гос. номер:</div>
                    <div class="summary-value">${appState.mtInstallData.vehicleNumber}</div>
                </div>
                ` : ''}
                <div class="summary-item">
                    <div class="summary-label">Марка МТ:</div>
                    <div class="summary-value">${appState.mtInstallData.mtBrand}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Номер МТ:</div>
                    <div class="summary-value">${appState.mtInstallData.mtNumber}</div>
                </div>
            </div>
            
            <div style="margin: 20px 0; border-top: 1px solid var(--border-color); padding-top: 20px;">
                <h4 style="margin-bottom: 15px; color: var(--primary-color);">
                    <i class="fas fa-camera"></i> Загрузка фотографий
                </h4>
                
                <p style="color: var(--text-secondary); margin-bottom: 15px;">
                    Вы выбрали для фотографирования: <strong>${selectedPhotos.join(', ')}</strong>
                </p>
                
                <p style="color: var(--text-secondary); margin-bottom: 15px;">
                    Загрузите фотографии для выбранных пунктов (максимум 10 фото):
                </p>
                
                <div class="photo-preview-container" id="photo-preview-container">
                    <div class="add-photo-btn" id="add-photo-btn">
                        <i class="fas fa-plus"></i>
                        <span>Добавить фото</span>
                        <input type="file" id="photo-input" accept="image/*" multiple style="display: none;">
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label>Комментарий к фотоотчету (необязательно)</label>
                    <textarea class="form-control" id="photo-comment" placeholder="Дополнительная информация..." rows="3"></textarea>
                </div>
            </div>
            
            <button class="btn btn-success" id="submit-mt-photo-report-btn" ${appState.photos.length === 0 ? 'disabled' : ''}>
                <i class="fas fa-paper-plane btn-icon"></i>
                Отправить фотоотчет
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    initPhotoUpload(10);

    document.getElementById('submit-mt-photo-report-btn').addEventListener('click', submitMtPhotoReport);
}

async function submitMtPhotoReport() {
    if (appState.photos.length === 0) {
        tg.showAlert('Добавьте хотя бы одно фото');
        return;
    }

    showLoading('Отправка фотоотчета...');

    try {
        const photoPromises = appState.photos.map(photo => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64Data = e.target.result.split(',')[1];
                    resolve(base64Data);
                };
                reader.readAsDataURL(photo.file);
            });
        });

        const photosBase64 = await Promise.all(photoPromises);

        const reportData = {
            action: 'submit_complete_work_report',
            record_id: appState.selectedWork.id,
            client: appState.selectedWork.client,
            service_type: 'mt_install',
            organization: appState.selectedWork.organization,
            contact_person: appState.selectedWork.contactPerson,
            phone: appState.selectedWork.phone,
            contact_unknown: appState.selectedWork.contactUnknown,
            vehicle_number: appState.mtInstallData.vehicleNumber || appState.selectedWork.vehicleNumber,
            vehicle_unknown: appState.selectedWork.vehicleUnknown,
            date: appState.selectedWork.date,
            time: appState.selectedWork.time,
            photos: photosBase64,
            work_data: {
                type: 'mt_install',
                data: appState.mtInstallData
            },
            comment: document.getElementById('photo-comment')?.value.trim() || '',
            record_comment: appState.selectedWork.comment || ''
        };

        // Отправляем данные через Telegram WebApp
        tg.sendData(JSON.stringify(reportData));

        // Также отправляем в Telegram чат в топик 7
        await sendWorkReportToTelegram(reportData);

        hideLoading();

        // Обновляем запись в локальном хранилище
        const workIndex = appState.records.findIndex(r => r.id === appState.selectedWork.id);
        if (workIndex !== -1) {
            appState.records[workIndex].status = 'completed';
            appState.records[workIndex].photo_reports = appState.photos.length;
            appState.records[workIndex].photo_reports_data = appState.photos;
            appState.records[workIndex].mt_install_data = appState.mtInstallData;
            appState.records[workIndex].completedAt = new Date().toISOString();
            localStorage.setItem('work_records', JSON.stringify(appState.records));
            updateRecordCount();
        }

        showModal(
            '✅ Фотоотчет отправлен!',
            `Фотоотчет по монтажу МТ успешно отправлен в рабочий чат (топик #7).<br><br>
             📸 Отправлено фото: ${appState.photos.length}<br>
             🏢 Организация: ${appState.selectedWork.organization}<br>
             ${appState.selectedWork.contactUnknown ? 
               '👤 Представитель: Неизвестен<br>' : 
               `👤 Представитель: ${appState.selectedWork.contactPerson}<br>`}
             ${!appState.selectedWork.contactUnknown ? 
               `📞 Телефон: ${appState.selectedWork.phone}<br>` : ''}
             🚗 ТС: ${appState.mtInstallData.vehicleBrand} ${appState.mtInstallData.vehicleModel}<br>
             📱 МТ: ${appState.mtInstallData.mtBrand} №${appState.mtInstallData.mtNumber}<br>
             💬 Отправлено в топик: #${telegramConfig.submissionTopicId}<br>
             📋 Chat ID: ${telegramConfig.staffChatId}<br><br>
             Все данные отправлены в указанный чат.`
        );

        setTimeout(() => {
            closeModal();
            showMainMenu();
        }, 3000);

    } catch (error) {
        hideLoading();
        console.error('Error submitting MT photo report:', error);
        tg.showAlert('Ошибка при отправке фотоотчета');
    }
}

function showTahoWorkForm() {
    appState.currentPage = 'taho-work-form';
    appState.history.push('work-organization-form');

    const clientName = getClientName(appState.selectedWork.client);
    const serviceName = getServiceDisplayName(appState.selectedWorkType);
    elements.pageTitle.textContent = `${serviceName} - ${clientName}`;

    if (!appState.tahoWorkData) {
        appState.tahoWorkData = {
            category: '',
            vehicleBrand: '',
            vehicleModel: '',
            vehicleNumber: '',
            tahoBrand: '',
            tahoNumber: '',
            skziNumber: '',
            photoTypes: {
                tahoLabel: false,
                skziCertificate: false,
                wheelBrand: false,
                mileage: false,
                pps: false,
                ds: false
            }
        };
    }

    const vehicleNumber = appState.selectedWork.vehicleNumber && !appState.selectedWork.vehicleUnknown
        ? appState.selectedWork.vehicleNumber
        : '';

    let html = `
        <div class="taho-work-form-container">
            <div class="form-section">
                <div class="form-section-title">📋 Категория работы</div>
                
                <div class="category-grid">
                    <div class="category-item ${appState.tahoWorkData.category === 'mount' ? 'selected' : ''}" data-category="mount">
                        <i class="fas fa-wrench"></i>
                        <span>Монтаж</span>
                    </div>
                    <div class="category-item ${appState.tahoWorkData.category === 'demount' ? 'selected' : ''}" data-category="demount">
                        <i class="fas fa-screwdriver"></i>
                        <span>Демонтаж</span>
                    </div>
                    <div class="category-item ${appState.tahoWorkData.category === 'diagnostic' ? 'selected' : ''}" data-category="diagnostic">
                        <i class="fas fa-stethoscope"></i>
                        <span>Диагностика</span>
                    </div>
                    <div class="category-item ${appState.tahoWorkData.category === 'verification' ? 'selected' : ''}" data-category="verification">
                        <i class="fas fa-clipboard-check"></i>
                        <span>Поверка</span>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">🚗 Данные транспортного средства</div>
                
                <div class="input-group">
                    <label class="required">Марка ТС</label>
                    <input type="text" class="form-input" id="taho-vehicle-brand" 
                           placeholder="Например: ГАЗ" 
                           value="${appState.tahoWorkData.vehicleBrand || ''}">
                </div>
                
                <div class="input-group">
                    <label class="required">Модель ТС</label>
                    <input type="text" class="form-input" id="taho-vehicle-model" 
                           placeholder="Например: ГАЗель NEXT" 
                           value="${appState.tahoWorkData.vehicleModel || ''}">
                </div>
                
                <div class="input-group">
                    <label>Гос. номер ТС</label>
                    <input type="text" class="form-input" id="taho-vehicle-number" 
                           placeholder="А123БВ777" 
                           value="${vehicleNumber || appState.tahoWorkData.vehicleNumber || ''}">
                </div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">📱 Данные ТАХО</div>
                
                <div class="input-group">
                    <label class="required">Марка ТАХО</label>
                    <input type="text" class="form-input" id="taho-brand" 
                           placeholder="Например: ШТРИХ-ТАХО" 
                           value="${appState.tahoWorkData.tahoBrand || ''}">
                </div>
                
                <div class="input-group">
                    <label class="required">Номер ТАХО</label>
                    <input type="text" class="form-input" id="taho-number" 
                           placeholder="Уникальный номер устройства" 
                           value="${appState.tahoWorkData.tahoNumber || ''}">
                </div>

                <div class="input-group">
                    <label class="required">Номер СКЗИ</label>
                    <input type="text" class="form-input" id="taho-skzi-number" 
                           placeholder="Номер СКЗИ" 
                           value="${appState.tahoWorkData.skziNumber || ''}">
                </div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">📸 Выберите фотографии (чекбоксы)</div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-taho-label" ${appState.tahoWorkData.photoTypes.tahoLabel ? 'checked' : ''}>
                    <label for="photo-taho-label">Шильдик ТАХО</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-skzi-certificate" ${appState.tahoWorkData.photoTypes.skziCertificate ? 'checked' : ''}>
                    <label for="photo-skzi-certificate">Сертификат СКЗИ</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-wheel-brand" ${appState.tahoWorkData.photoTypes.wheelBrand ? 'checked' : ''}>
                    <label for="photo-wheel-brand">Марка колеса</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-mileage" ${appState.tahoWorkData.photoTypes.mileage ? 'checked' : ''}>
                    <label for="photo-mileage">Пробег</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-pps" ${appState.tahoWorkData.photoTypes.pps ? 'checked' : ''}>
                    <label for="photo-pps">ППС</label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="photo-ds" ${appState.tahoWorkData.photoTypes.ds ? 'checked' : ''}>
                    <label for="photo-ds">ДС</label>
                </div>
            </div>
            
            <button class="btn btn-primary" id="continue-to-taho-photos-btn" ${!appState.tahoWorkData.category ? 'disabled' : ''}>
                <i class="fas fa-arrow-right btn-icon"></i>
                Перейти к загрузке фото
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.category-item').forEach(el => {
                el.classList.remove('selected');
            });
            item.classList.add('selected');
            appState.tahoWorkData.category = item.dataset.category;
            document.getElementById('continue-to-taho-photos-btn').disabled = false;
        });
    });

    document.getElementById('continue-to-taho-photos-btn').addEventListener('click', () => {
        appState.tahoWorkData.vehicleBrand = document.getElementById('taho-vehicle-brand').value.trim();
        appState.tahoWorkData.vehicleModel = document.getElementById('taho-vehicle-model').value.trim();
        appState.tahoWorkData.vehicleNumber = document.getElementById('taho-vehicle-number').value.trim();
        appState.tahoWorkData.tahoBrand = document.getElementById('taho-brand').value.trim();
        appState.tahoWorkData.tahoNumber = document.getElementById('taho-number').value.trim();
        appState.tahoWorkData.skziNumber = document.getElementById('taho-skzi-number').value.trim();

        appState.tahoWorkData.photoTypes = {
            tahoLabel: document.getElementById('photo-taho-label').checked,
            skziCertificate: document.getElementById('photo-skzi-certificate').checked,
            wheelBrand: document.getElementById('photo-wheel-brand').checked,
            mileage: document.getElementById('photo-mileage').checked,
            pps: document.getElementById('photo-pps').checked,
            ds: document.getElementById('photo-ds').checked
        };

        if (!appState.tahoWorkData.vehicleBrand || !appState.tahoWorkData.vehicleModel ||
            !appState.tahoWorkData.tahoBrand || !appState.tahoWorkData.tahoNumber ||
            !appState.tahoWorkData.skziNumber) {
            tg.showAlert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        const hasSelectedPhotos = Object.values(appState.tahoWorkData.photoTypes).some(value => value);
        if (!hasSelectedPhotos) {
            tg.showAlert('Пожалуйста, выберите хотя бы один пункт для фотографирования');
            return;
        }

        showTahoPhotoUpload();
    });
}

function showTahoPhotoUpload() {
    appState.currentPage = 'taho-photo-upload';
    appState.history.push('taho-work-form');

    const clientName = getClientName(appState.selectedWork.client);
    const serviceName = getServiceDisplayName(appState.selectedWorkType);
    elements.pageTitle.textContent = `Фотоотчет ТАХО - ${clientName}`;

    const categoryNames = {
        'mount': 'Монтаж',
        'demount': 'Демонтаж',
        'diagnostic': 'Диагностика',
        'verification': 'Поверка'
    };

    const selectedPhotos = [];
    if (appState.tahoWorkData.photoTypes.tahoLabel) selectedPhotos.push('Шильдик ТАХО');
    if (appState.tahoWorkData.photoTypes.skziCertificate) selectedPhotos.push('Сертификат СКЗИ');
    if (appState.tahoWorkData.photoTypes.wheelBrand) selectedPhotos.push('Марка колеса');
    if (appState.tahoWorkData.photoTypes.mileage) selectedPhotos.push('Пробег');
    if (appState.tahoWorkData.photoTypes.pps) selectedPhotos.push('ППС');
    if (appState.tahoWorkData.photoTypes.ds) selectedPhotos.push('ДС');

    let html = `
        <div class="photo-upload-container">
            <div class="summary-item">
                <div class="summary-label">Тип работы:</div>
                <div class="summary-value">${serviceName}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Категория:</div>
                <div class="summary-value">${categoryNames[appState.tahoWorkData.category] || ''}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Клиент:</div>
                <div class="summary-value">${clientName}</div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">📋 Данные ТАХО</div>
                <div class="summary-item">
                    <div class="summary-label">ТС:</div>
                    <div class="summary-value">${appState.tahoWorkData.vehicleBrand} ${appState.tahoWorkData.vehicleModel}</div>
                </div>
                ${appState.tahoWorkData.vehicleNumber ? `
                <div class="summary-item">
                    <div class="summary-label">Гос. номер:</div>
                    <div class="summary-value">${appState.tahoWorkData.vehicleNumber}</div>
                </div>
                ` : ''}
                <div class="summary-item">
                    <div class="summary-label">Марка ТАХО:</div>
                    <div class="summary-value">${appState.tahoWorkData.tahoBrand}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Номер ТАХО:</div>
                    <div class="summary-value">${appState.tahoWorkData.tahoNumber}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Номер СКЗИ:</div>
                    <div class="summary-value">${appState.tahoWorkData.skziNumber}</div>
                </div>
            </div>
            
            <div style="margin: 20px 0; border-top: 1px solid var(--border-color); padding-top: 20px;">
                <h4 style="margin-bottom: 15px; color: var(--primary-color);">
                    <i class="fas fa-camera"></i> Загрузка фотографий
                </h4>
                
                <p style="color: var(--text-secondary); margin-bottom: 15px;">
                    Вы выбрали для фотографирования: <strong>${selectedPhotos.join(', ')}</strong>
                </p>
                
                <p style="color: var(--text-secondary); margin-bottom: 15px;">
                    Загрузите фотографии для выбранных пунктов (максимум 15 фото):
                </p>
                
                <div class="photo-preview-container" id="photo-preview-container">
                    <div class="add-photo-btn" id="add-photo-btn">
                        <i class="fas fa-plus"></i>
                        <span>Добавить фото</span>
                        <input type="file" id="photo-input" accept="image/*" multiple style="display: none;">
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label>Комментарий к фотоотчету (необязательно)</label>
                    <textarea class="form-control" id="photo-comment" placeholder="Дополнительная информация..." rows="3"></textarea>
                </div>
            </div>
            
            <button class="btn btn-success" id="submit-taho-photo-report-btn" ${appState.photos.length === 0 ? 'disabled' : ''}>
                <i class="fas fa-paper-plane btn-icon"></i>
                Отправить фотоотчет
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    initPhotoUpload(15);

    document.getElementById('submit-taho-photo-report-btn').addEventListener('click', submitTahoPhotoReport);
}

async function submitTahoPhotoReport() {
    if (appState.photos.length === 0) {
        tg.showAlert('Добавьте хотя бы одно фото');
        return;
    }

    showLoading('Отправка фотоотчета...');

    try {
        const photoPromises = appState.photos.map(photo => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64Data = e.target.result.split(',')[1];
                    resolve(base64Data);
                };
                reader.readAsDataURL(photo.file);
            });
        });

        const photosBase64 = await Promise.all(photoPromises);

        const reportData = {
            action: 'submit_complete_work_report',
            record_id: appState.selectedWork.id,
            client: appState.selectedWork.client,
            service_type: appState.selectedWorkType,
            organization: appState.selectedWork.organization,
            contact_person: appState.selectedWork.contactPerson,
            phone: appState.selectedWork.phone,
            contact_unknown: appState.selectedWork.contactUnknown,
            vehicle_number: appState.tahoWorkData.vehicleNumber || appState.selectedWork.vehicleNumber,
            vehicle_unknown: appState.selectedWork.vehicleUnknown,
            date: appState.selectedWork.date,
            time: appState.selectedWork.time,
            photos: photosBase64,
            work_data: {
                type: 'taho',
                category: appState.tahoWorkData.category,
                data: appState.tahoWorkData
            },
            comment: document.getElementById('photo-comment')?.value.trim() || '',
            record_comment: appState.selectedWork.comment || ''
        };

        tg.sendData(JSON.stringify(reportData));

        await sendWorkReportToTelegram(reportData);

        hideLoading();

        const workIndex = appState.records.findIndex(r => r.id === appState.selectedWork.id);
        if (workIndex !== -1) {
            appState.records[workIndex].status = 'completed';
            appState.records[workIndex].photo_reports = appState.photos.length;
            appState.records[workIndex].photo_reports_data = appState.photos;
            appState.records[workIndex].taho_work_data = appState.tahoWorkData;
            appState.records[workIndex].completedAt = new Date().toISOString();
            localStorage.setItem('work_records', JSON.stringify(appState.records));
            updateRecordCount();
        }

        showModal(
            '✅ Фотоотчет отправлен!',
            `Фотоотчет по ${getServiceDisplayName(appState.selectedWorkType)} успешно отправлен в рабочий чат (топик #7).<br><br>
             📸 Отправлено фото: ${appState.photos.length}<br>
             🏢 Организация: ${appState.selectedWork.organization}<br>
             ${appState.selectedWork.contactUnknown ? 
               '👤 Представитель: Неизвестен<br>' : 
               `👤 Представитель: ${appState.selectedWork.contactPerson}<br>`}
             ${!appState.selectedWork.contactUnknown ? 
               `📞 Телефон: ${appState.selectedWork.phone}<br>` : ''}
             🚗 ТС: ${appState.tahoWorkData.vehicleBrand} ${appState.tahoWorkData.vehicleModel}<br>
             📱 ТАХО: ${appState.tahoWorkData.tahoBrand} №${appState.tahoWorkData.tahoNumber}<br>
             🔑 СКЗИ: ${appState.tahoWorkData.skziNumber}<br><br>
             💬 Отправлено в топик: #${telegramConfig.submissionTopicId}<br>
             📋 Chat ID: ${telegramConfig.staffChatId}<br><br>
             Все данные отправлены в указанный чат.`
        );

        setTimeout(() => {
            closeModal();
            showMainMenu();
        }, 3000);

    } catch (error) {
        hideLoading();
        console.error('Error submitting TAHO photo report:', error);
        tg.showAlert('Ошибка при отправке фотоотчета');
    }
}

function showSimpleDiagnosticForm() {
    appState.currentPage = 'simple-diagnostic-form';
    appState.history.push('work-organization-form');

    const clientName = getClientName(appState.selectedWork.client);
    elements.pageTitle.textContent = `Диагностика - ${clientName}`;

    if (!appState.simpleDiagnosticData) {
        appState.simpleDiagnosticData = {
            vehicleBrand: '',
            vehicleModel: '',
            vehicleNumber: '',
            partNumber: ''
        };
    }

    const vehicleNumber = appState.selectedWork.vehicleNumber && !appState.selectedWork.vehicleUnknown
        ? appState.selectedWork.vehicleNumber
        : '';

    let html = `
        <div class="simple-diagnostic-form-container">
            <div class="form-section">
                <div class="form-section-title">🚗 Данные транспортного средства</div>
                
                <div class="input-group">
                    <label class="required">Марка ТС</label>
                    <input type="text" class="form-input" id="sd-vehicle-brand" 
                           placeholder="Например: ГАЗ" 
                           value="${appState.simpleDiagnosticData.vehicleBrand || ''}">
                </div>
                
                <div class="input-group">
                    <label class="required">Модель ТС</label>
                    <input type="text" class="form-input" id="sd-vehicle-model" 
                           placeholder="Например: ГАЗель NEXT" 
                           value="${appState.simpleDiagnosticData.vehicleModel || ''}">
                </div>
                
                <div class="input-group">
                    <label class="required">Гос. номер ТС</label>
                    <input type="text" class="form-input" id="sd-vehicle-number" 
                           placeholder="А123БВ777" 
                           value="${vehicleNumber || appState.simpleDiagnosticData.vehicleNumber || ''}">
                </div>
                
                <div class="input-group">
                    <label>Номер З-Н (запчасти)</label>
                    <input type="text" class="form-input" id="sd-part-number" 
                           placeholder="Номер запчасти" 
                           value="${appState.simpleDiagnosticData.partNumber || ''}">
                </div>
            </div>
            
            <button class="btn btn-primary" id="continue-to-sd-photos-btn">
                <i class="fas fa-arrow-right btn-icon"></i>
                Перейти к загрузке фото
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    document.getElementById('continue-to-sd-photos-btn').addEventListener('click', () => {
        appState.simpleDiagnosticData = {
            vehicleBrand: document.getElementById('sd-vehicle-brand').value.trim(),
            vehicleModel: document.getElementById('sd-vehicle-model').value.trim(),
            vehicleNumber: document.getElementById('sd-vehicle-number').value.trim(),
            partNumber: document.getElementById('sd-part-number').value.trim()
        };

        if (!appState.simpleDiagnosticData.vehicleBrand || !appState.simpleDiagnosticData.vehicleModel ||
            !appState.simpleDiagnosticData.vehicleNumber) {
            tg.showAlert('Пожалуйста, заполните марку, модель и гос. номер ТС');
            return;
        }

        showSimpleDiagnosticPhotoUpload();
    });
}

function showSimpleDiagnosticPhotoUpload() {
    appState.currentPage = 'simple-diagnostic-photo-upload';
    appState.history.push('simple-diagnostic-form');

    const clientName = getClientName(appState.selectedWork.client);
    elements.pageTitle.textContent = `Фотоотчет диагностики - ${clientName}`;

    let html = `
        <div class="photo-upload-container">
            <div class="summary-item">
                <div class="summary-label">Тип работы:</div>
                <div class="summary-value">Диагностика</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Клиент:</div>
                <div class="summary-value">${clientName}</div>
            </div>
            
            <div class="form-section">
                <div class="form-section-title">📋 Данные диагностики</div>
                <div class="summary-item">
                    <div class="summary-label">ТС:</div>
                    <div class="summary-value">${appState.simpleDiagnosticData.vehicleBrand} ${appState.simpleDiagnosticData.vehicleModel}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Гос. номер:</div>
                    <div class="summary-value">${appState.simpleDiagnosticData.vehicleNumber}</div>
                </div>
                ${appState.simpleDiagnosticData.partNumber ? `
                <div class="summary-item">
                    <div class="summary-label">Номер З-Н:</div>
                    <div class="summary-value">${appState.simpleDiagnosticData.partNumber}</div>
                </div>
                ` : ''}
            </div>
            
            <div style="margin: 20px 0; border-top: 1px solid var(--border-color); padding-top: 20px;">
                <h4 style="margin-bottom: 15px; color: var(--primary-color);">
                    <i class="fas fa-camera"></i> Загрузка фотографий (до 20 фото)
                </h4>
                
                <p style="color: var(--text-secondary); margin-bottom: 15px;">
                    Загрузите фотографии выполненных работ:
                </p>
                
                <div class="photo-preview-container" id="photo-preview-container">
                    <div class="add-photo-btn" id="add-photo-btn">
                        <i class="fas fa-plus"></i>
                        <span>Добавить фото</span>
                        <input type="file" id="photo-input" accept="image/*" multiple style="display: none;">
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label>Комментарий к фотоотчету (необязательно)</label>
                    <textarea class="form-control" id="photo-comment" placeholder="Описание выполненных работ..." rows="3"></textarea>
                </div>
            </div>
            
            <button class="btn btn-success" id="submit-sd-photo-report-btn" ${appState.photos.length === 0 ? 'disabled' : ''}>
                <i class="fas fa-paper-plane btn-icon"></i>
                Отправить фотоотчет
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    initPhotoUpload(20);

    document.getElementById('submit-sd-photo-report-btn').addEventListener('click', submitSimpleDiagnosticPhotoReport);
}

async function submitSimpleDiagnosticPhotoReport() {
    if (appState.photos.length === 0) {
        tg.showAlert('Добавьте хотя бы одно фото');
        return;
    }

    showLoading('Отправка фотоотчета...');

    try {
        const photoPromises = appState.photos.map(photo => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64Data = e.target.result.split(',')[1];
                    resolve(base64Data);
                };
                reader.readAsDataURL(photo.file);
            });
        });

        const photosBase64 = await Promise.all(photoPromises);

        const reportData = {
            action: 'submit_complete_work_report',
            record_id: appState.selectedWork.id,
            client: appState.selectedWork.client,
            service_type: 'diagnostic',
            organization: appState.selectedWork.organization,
            contact_person: appState.selectedWork.contactPerson,
            phone: appState.selectedWork.phone,
            contact_unknown: appState.selectedWork.contactUnknown,
            vehicle_number: appState.simpleDiagnosticData.vehicleNumber || appState.selectedWork.vehicleNumber,
            vehicle_unknown: appState.selectedWork.vehicleUnknown,
            date: appState.selectedWork.date,
            time: appState.selectedWork.time,
            photos: photosBase64,
            work_data: {
                type: 'diagnostic',
                data: appState.simpleDiagnosticData
            },
            comment: document.getElementById('photo-comment')?.value.trim() || '',
            record_comment: appState.selectedWork.comment || ''
        };

        tg.sendData(JSON.stringify(reportData));

        await sendWorkReportToTelegram(reportData);

        hideLoading();

        const workIndex = appState.records.findIndex(r => r.id === appState.selectedWork.id);
        if (workIndex !== -1) {
            appState.records[workIndex].status = 'completed';
            appState.records[workIndex].photo_reports = appState.photos.length;
            appState.records[workIndex].photo_reports_data = appState.photos;
            appState.records[workIndex].diagnostic_data = appState.simpleDiagnosticData;
            appState.records[workIndex].completedAt = new Date().toISOString();
            localStorage.setItem('work_records', JSON.stringify(appState.records));
            updateRecordCount();
        }

        showModal(
            '✅ Фотоотчет отправлен!',
            `Фотоотчет по диагностике успешно отправлен в рабочий чат (топик #7).<br><br>
             📸 Отправлено фото: ${appState.photos.length}<br>
             🏢 Организация: ${appState.selectedWork.organization}<br>
             ${appState.selectedWork.contactUnknown ? 
               '👤 Представитель: Неизвестен<br>' : 
               `👤 Представитель: ${appState.selectedWork.contactPerson}<br>`}
             ${!appState.selectedWork.contactUnknown ? 
               `📞 Телефон: ${appState.selectedWork.phone}<br>` : ''}
             🚗 ТС: ${appState.simpleDiagnosticData.vehicleBrand} ${appState.simpleDiagnosticData.vehicleModel}<br>
             🏷️ Гос. номер: ${appState.simpleDiagnosticData.vehicleNumber}<br><br>
             💬 Отправлено в топик: #${telegramConfig.submissionTopicId}<br>
             📋 Chat ID: ${telegramConfig.staffChatId}<br><br>
             Все данные отправлены в указанный чат.`
        );

        setTimeout(() => {
            closeModal();
            showMainMenu();
        }, 3000);

    } catch (error) {
        hideLoading();
        console.error('Error submitting simple diagnostic report:', error);
        tg.showAlert('Ошибка при отправке фотоотчета');
    }
}

function showPhotoUpload() {
    appState.currentPage = 'photo-upload';
    appState.history.push('work-organization-form');

    const serviceName = getServiceDisplayName(appState.selectedWorkType);
    const clientName = getClientName(appState.selectedWork.client);

    elements.pageTitle.textContent = `Фотоотчет - ${clientName}`;

    let html = `
        <div class="photo-upload-container">
            <div class="summary-item">
                <div class="summary-label">Тип работы:</div>
                <div class="summary-value">${serviceName}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Клиент:</div>
                <div class="summary-value">${clientName}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Дата:</div>
                <div class="summary-value">${appState.selectedWork.date} ${appState.selectedWork.time}</div>
            </div>
            
            ${appState.selectedWork.organization ? `
                <div class="summary-item">
                    <div class="summary-label">Организация:</div>
                    <div class="summary-value">${appState.selectedWork.organization}</div>
                </div>
            ` : ''}
            
            <div style="margin: 20px 0; border-top: 1px solid var(--border-color); padding-top: 20px;">
                <h4 style="margin-bottom: 15px; color: var(--primary-color);">
                    <i class="fas fa-camera"></i> Фотоотчет
                </h4>
                
                <p style="color: var(--text-secondary); margin-bottom: 15px;">
                    Прикрепите фото выполненной работы (максимум 10 фото):
                </p>
                
                <div class="photo-preview-container" id="photo-preview-container">
                    <div class="add-photo-btn" id="add-photo-btn">
                        <i class="fas fa-plus"></i>
                        <span>Добавить фото</span>
                        <input type="file" id="photo-input" accept="image/*" multiple style="display: none;">
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label>Комментарий к фотоотчету (необязательно)</label>
                    <textarea class="form-control" id="photo-comment" placeholder="Описание выполненных работ..." rows="3"></textarea>
                </div>
            </div>
            
            <button class="btn btn-success" id="submit-photo-report-btn" ${appState.photos.length === 0 ? 'disabled' : ''}>
                <i class="fas fa-paper-plane btn-icon"></i>
                Отправить фотоотчет
            </button>
        </div>
    `;

    elements.dynamicContent.innerHTML = html;
    elements.dynamicContent.style.display = 'block';

    initPhotoUpload(10);

    document.getElementById('submit-photo-report-btn').addEventListener('click', submitPhotoReport);
}

function initPhotoUpload(maxPhotos = 10) {
    const photoInput = document.createElement('input');
    photoInput.type = 'file';
    photoInput.accept = 'image/*';
    photoInput.multiple = true;
    photoInput.style.display = 'none';

    document.body.appendChild(photoInput);

    const addPhotoBtn = document.getElementById('add-photo-btn');
    if (addPhotoBtn) {
        addPhotoBtn.addEventListener('click', () => {
            photoInput.click();
        });
    }

    photoInput.addEventListener('change', (event) => {
        const files = Array.from(event.target.files);

        const remainingSlots = maxPhotos - appState.photos.length;
        if (files.length > remainingSlots) {
            tg.showAlert(`Можно добавить не более ${remainingSlots} фото`);
            files.splice(remainingSlots);
        }

        files.forEach(file => {
            if (appState.photos.length >= maxPhotos) {
                tg.showAlert(`Максимальное количество фото - ${maxPhotos}`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const photoData = {
                    id: Date.now() + Math.random(),
                    dataUrl: e.target.result,
                    file: file
                };

                appState.photos.push(photoData);
                updatePhotoPreview();
                updateSubmitButton();
            };
            reader.readAsDataURL(file);
        });

        photoInput.value = '';
    });
}

function updatePhotoPreview() {
    const container = document.getElementById('photo-preview-container');

    if (!container) return;

    container.innerHTML = '';

    appState.photos.forEach((photo, index) => {
        const preview = document.createElement('div');
        preview.className = 'photo-preview';

        preview.innerHTML = `
            <img src="${photo.dataUrl}" alt="Фото ${index + 1}">
            <button class="remove-photo" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(preview);
    });

    const remainingPhotos = 20 - appState.photos.length;
    if (appState.photos.length < 20) {
        const addBtn = document.createElement('div');
        addBtn.className = 'add-photo-btn';
        addBtn.id = 'add-photo-btn';
        addBtn.innerHTML = `
            <i class="fas fa-plus"></i>
            <span>Добавить фото (осталось ${remainingPhotos})</span>
        `;
        container.appendChild(addBtn);

        const photoInput = document.querySelector('input[type="file"]');
        if (photoInput) {
            addBtn.addEventListener('click', () => {
                photoInput.click();
            });
        }
    }

    document.querySelectorAll('.remove-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            appState.photos.splice(index, 1);
            updatePhotoPreview();
            updateSubmitButton();
        });
    });
}

function updateSubmitButton() {
    const mtSubmitBtn = document.getElementById('submit-mt-photo-report-btn');
    if (mtSubmitBtn) {
        mtSubmitBtn.disabled = appState.photos.length === 0;
    }

    const tahoSubmitBtn = document.getElementById('submit-taho-photo-report-btn');
    if (tahoSubmitBtn) {
        tahoSubmitBtn.disabled = appState.photos.length === 0;
    }

    const sdSubmitBtn = document.getElementById('submit-sd-photo-report-btn');
    if (sdSubmitBtn) {
        sdSubmitBtn.disabled = appState.photos.length === 0;
    }

    const submitBtn = document.getElementById('submit-photo-report-btn');
    if (submitBtn) {
        submitBtn.disabled = appState.photos.length === 0;
    }
}

async function submitPhotoReport() {
    if (appState.photos.length === 0) {
        tg.showAlert('Добавьте хотя бы одно фото');
        return;
    }

    showLoading('Отправка фотоотчета...');

    try {
        const photoPromises = appState.photos.map(photo => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64Data = e.target.result.split(',')[1];
                    resolve(base64Data);
                };
                reader.readAsDataURL(photo.file);
            });
        });

        const photosBase64 = await Promise.all(photoPromises);

        const reportData = {
            action: 'submit_complete_work_report',
            record_id: appState.selectedWork.id,
            client: appState.selectedWork.client,
            service_type: appState.selectedWorkType,
            organization: appState.selectedWork.organization,
            contact_person: appState.selectedWork.contactPerson,
            phone: appState.selectedWork.phone,
            contact_unknown: appState.selectedWork.contactUnknown,
            vehicle_number: appState.selectedWork.vehicleNumber,
            vehicle_unknown: appState.selectedWork.vehicleUnknown,
            date: appState.selectedWork.date,
            time: appState.selectedWork.time,
            photos: photosBase64,
            work_data: {
                type: 'general'
            },
            comment: document.getElementById('photo-comment')?.value.trim() || '',
            record_comment: appState.selectedWork.comment || ''
        };

        tg.sendData(JSON.stringify(reportData));

        await sendWorkReportToTelegram(reportData);

        hideLoading();

        showModal(
            '✅ Фотоотчет отправлен!',
            `Фотоотчет успешно отправлен в рабочий чат (топик #7).<br><br>
             📸 Отправлено фото: ${appState.photos.length}<br>
             🏢 Организация: ${appState.selectedWork.organization}<br>
             ${appState.selectedWork.contactUnknown ? 
               '👤 Представитель: Неизвестен<br>' : 
               `👤 Представитель: ${appState.selectedWork.contactPerson}<br>`}
             ${!appState.selectedWork.contactUnknown ? 
               `📞 Телефон: ${appState.selectedWork.phone}<br>` : ''}
             🔧 Тип работы: ${getServiceDisplayName(appState.selectedWorkType)}<br>
             👤 Клиент: ${getClientName(appState.selectedWork.client)}<br><br>
             💬 Отправлено в топик: #${telegramConfig.submissionTopicId}<br>
             📋 Chat ID: ${telegramConfig.staffChatId}<br><br>
             Все данные отправлены в указанный чат.`
        );

        const workIndex = appState.records.findIndex(r => r.id === appState.selectedWork.id);
        if (workIndex !== -1) {
            appState.records[workIndex].status = 'completed';
            appState.records[workIndex].photo_reports = appState.photos.length;
            appState.records[workIndex].photo_reports_data = appState.photos;
            localStorage.setItem('work_records', JSON.stringify(appState.records));
            updateRecordCount();
        }

        setTimeout(() => {
            closeModal();
            showMainMenu();
        }, 3000);

    } catch (error) {
        hideLoading();
        console.error('Error submitting photo report:', error);
        tg.showAlert('Ошибка при отправке фотоотчета');
    }
}

window.showServiceTypeSelection = showServiceTypeSelection;
window.loadPendingWorks = loadPendingWorks;
window.showWorkList = showWorkList;
window.showOrganizationFormForWork = showOrganizationFormForWork;
window.validateWorkOrganizationForm = validateWorkOrganizationForm;
window.showMtInstallForm = showMtInstallForm;
window.showMtPhotoUpload = showMtPhotoUpload;
window.submitMtPhotoReport = submitMtPhotoReport;
window.showTahoWorkForm = showTahoWorkForm;
window.showTahoPhotoUpload = showTahoPhotoUpload;
window.submitTahoPhotoReport = submitTahoPhotoReport;
window.showSimpleDiagnosticForm = showSimpleDiagnosticForm;
window.showSimpleDiagnosticPhotoUpload = showSimpleDiagnosticPhotoUpload;
window.submitSimpleDiagnosticPhotoReport = submitSimpleDiagnosticPhotoReport;
window.showPhotoUpload = showPhotoUpload;
window.initPhotoUpload = initPhotoUpload;
window.updatePhotoPreview = updatePhotoPreview;
window.updateSubmitButton = updateSubmitButton;
window.submitPhotoReport = submitPhotoReport;