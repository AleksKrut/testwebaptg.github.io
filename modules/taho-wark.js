// Функции для сдачи работ по ТАХО

function showTahoWorkForm() {
    appState.currentPage = 'taho-work-form';
    appState.history.push('work-list');

    const clientName = getClientName(appState.selectedWork.client);
    const serviceName = getServiceDisplayName(appState.selectedWorkType);
    elements.pageTitle.textContent = `${serviceName} - ${clientName}`;

    // Инициализация данных для ТАХО
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

    // Выбор категории
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
        // Собираем данные
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

        // Валидация
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

    initPhotoUpload();

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
            action: 'submit_taho_work_report',
            record_id: appState.selectedWork.id,
            service_type: appState.selectedWorkType,
            category: appState.tahoWorkData.category,
            photos: photosBase64,
            taho_work_data: appState.tahoWorkData,
            comment: document.getElementById('photo-comment')?.value.trim() || ''
        };

        tg.sendData(JSON.stringify(reportData));

        hideLoading();

        // Обновляем запись в локальном хранилище
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
            `Фотоотчет по ${getServiceDisplayName(appState.selectedWorkType)} успешно отправлен.<br><br>
             📸 Отправлено фото: ${appState.photos.length}<br>
             🚗 ТС: ${appState.tahoWorkData.vehicleBrand} ${appState.tahoWorkData.vehicleModel}<br>
             📱 ТАХО: ${appState.tahoWorkData.tahoBrand} №${appState.tahoWorkData.tahoNumber}<br>
             🔑 СКЗИ: ${appState.tahoWorkData.skziNumber}<br><br>
             Фото будут проверены менеджером.`
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

// Функция для сдачи работ клиентов SKAI, ТТ, CityPoint (простая диагностика)
function showSimpleDiagnosticForm() {
    appState.currentPage = 'simple-diagnostic-form';
    appState.history.push('work-list');

    const clientName = getClientName(appState.selectedWork.client);
    elements.pageTitle.textContent = `Диагностика - ${clientName}`;

    // Инициализация данных для простой диагностики
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

        // Валидация
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

    // Переопределяем initPhotoUpload для 20 фото
    const maxPhotos = 20;
    initPhotoUpload(maxPhotos);

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
            action: 'submit_simple_diagnostic_report',
            record_id: appState.selectedWork.id,
            service_type: 'diagnostic',
            photos: photosBase64,
            diagnostic_data: appState.simpleDiagnosticData,
            comment: document.getElementById('photo-comment')?.value.trim() || ''
        };

        tg.sendData(JSON.stringify(reportData));

        hideLoading();

        // Обновляем запись в локальном хранилище
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
            `Фотоотчет по диагностике успешно отправлен.<br><br>
             📸 Отправлено фото: ${appState.photos.length}<br>
             🚗 ТС: ${appState.simpleDiagnosticData.vehicleBrand} ${appState.simpleDiagnosticData.vehicleModel}<br>
             🏷️ Гос. номер: ${appState.simpleDiagnosticData.vehicleNumber}<br><br>
             Фото будут проверены менеджером.`
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

// Экспорт функций
window.showTahoWorkForm = showTahoWorkForm;
window.showTahoPhotoUpload = showTahoPhotoUpload;
window.submitTahoPhotoReport = submitTahoPhotoReport;
window.showSimpleDiagnosticForm = showSimpleDiagnosticForm;
window.showSimpleDiagnosticPhotoUpload = showSimpleDiagnosticPhotoUpload;
window.submitSimpleDiagnosticPhotoReport = submitSimpleDiagnosticPhotoReport;
