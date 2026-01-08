# Shiftly — Roadmap

## Поточний стан

**Готово:**
- Аутентифікація (реєстрація, логін, JWT)
- CRUD для співробітників, змін, відділів
- База даних з повною схемою (Prisma)
- Базовий UI: логін, реєстрація, тижневий розклад, список співробітників
- Мультитенантність (organization scope)

**Відсутнє:**
- Тести
- Валідація вхідних даних
- UI для редагування (модалки, форми)
- Drag-and-drop розкладу
- Експорт (PDF/Excel)
- Ролі в UI (admin/manager/employee)

---

## Фаза 1: Стабілізація (4-6 тижнів)

### 1.1 Тестування
- [ ] Unit тести для backend services
- [ ] Integration тести для API endpoints
- [ ] E2E тести для критичних user flows (Playwright)
- [ ] CI pipeline (GitHub Actions)

### 1.2 Валідація та безпека
- [ ] Input validation middleware (Zod)
- [ ] Rate limiting
- [ ] Sanitization (XSS prevention)
- [ ] CORS налаштування для production
- [ ] Helmet.js для security headers

### 1.3 Error handling
- [ ] Централізований error handler
- [ ] Structured logging (Pino/Winston)
- [ ] Error boundaries в React
- [ ] User-friendly error messages

### 1.4 Performance
- [ ] Пагінація для всіх list endpoints
- [ ] Database indexes для частих запитів
- [ ] API response caching (Redis)
- [ ] Frontend lazy loading

---

## Фаза 2: Повний функціонал (6-8 тижнів)

### 2.1 Управління співробітниками
- [ ] Модальне вікно створення/редагування співробітника
- [ ] Налаштування доступності (availability)
- [ ] Імпорт співробітників з CSV/Excel
- [ ] Профіль співробітника з історією змін
- [ ] Фото профілю (upload)

### 2.2 Розклад змін
- [ ] Drag-and-drop редагування (@dnd-kit — вже встановлено)
- [ ] Денний та місячний види
- [ ] Копіювання змін (день/тиждень)
- [ ] Шаблони розкладу
- [ ] Конфлікт-детекція (перекриття, ліміт годин)
- [ ] Bulk operations (масове редагування)

### 2.3 Відділи
- [ ] UI сторінка управління відділами
- [ ] Призначення співробітників до відділів
- [ ] Фільтрація розкладу по відділах
- [ ] Кольорове кодування

### 2.4 Експорт та звіти
- [ ] Експорт розкладу в PDF
- [ ] Експорт в Excel
- [ ] Звіт по годинах співробітників
- [ ] Друк розкладу

---

## Фаза 3: Розширені можливості (8-10 тижнів)

### 3.1 Ролі та доступ
- [ ] Повна RBAC система (Admin/Manager/Employee)
- [ ] Manager: доступ тільки до свого відділу
- [ ] Employee: перегляд свого розкладу
- [ ] Invite system (запрошення по email)
- [ ] Self-registration для співробітників

### 3.2 Сповіщення
- [ ] In-app notifications
- [ ] Email сповіщення (новий розклад, зміни)
- [ ] Push notifications (PWA)
- [ ] Reminders перед зміною

### 3.3 Запити та погодження
- [ ] Запит на вихідний (time-off request)
- [ ] Запит на обмін змінами (shift swap)
- [ ] Workflow погодження для менеджерів
- [ ] Історія запитів

### 3.4 Мобільна версія
- [ ] PWA (Progressive Web App)
- [ ] Responsive design оптимізація
- [ ] Offline режим (базовий перегляд)
- [ ] Native-like experience

---

## Фаза 4: Масштабування (10-12 тижнів)

### 4.1 Аналітика та дашборд
- [ ] Dashboard з ключовими метриками
- [ ] Графіки завантаженості
- [ ] Overtime tracking
- [ ] Labor cost калькуляція
- [ ] Attendance tracking

### 4.2 Інтеграції
- [ ] Google Calendar sync
- [ ] Outlook Calendar sync
- [ ] Slack notifications
- [ ] Zapier/Make webhooks
- [ ] API для зовнішніх систем

### 4.3 AI функції
- [ ] Smart scheduling (оптимізація розкладу)
- [ ] Demand forecasting
- [ ] Рекомендації по заповненню змін
- [ ] Аналіз патернів

### 4.4 Enterprise features
- [ ] SSO (SAML, OIDC)
- [ ] Audit logs
- [ ] Multi-location support
- [ ] Custom roles
- [ ] White-label опції

---

## Фаза 5: Комерціалізація (ongoing)

### 5.1 Billing
- [ ] Stripe інтеграція
- [ ] Pricing tiers (Free/Pro/Enterprise)
- [ ] Usage-based billing опція
- [ ] Trial period

### 5.2 Onboarding
- [ ] Interactive tutorial
- [ ] Sample data generation
- [ ] Onboarding wizard
- [ ] Help center / Knowledge base

### 5.3 Admin panel
- [ ] Super admin dashboard
- [ ] Customer management
- [ ] Usage analytics
- [ ] Support ticket system

---

## Технічний борг (паралельно)

- [ ] Міграція на Prisma migrations (замість db push)
- [ ] API versioning (/v1/, /v2/)
- [ ] OpenAPI/Swagger документація
- [ ] Containerization improvements (multi-stage builds)
- [ ] Kubernetes ready конфігурація
- [ ] Monitoring (Prometheus + Grafana)
- [ ] APM (Application Performance Monitoring)

---

## Пріоритети по тижнях

| Тиждень | Фокус |
|---------|-------|
| 1-2 | Unit тести backend + валідація |
| 3-4 | Integration тести + CI pipeline |
| 5-6 | E2E тести + error handling |
| 7-8 | Employee CRUD UI + модалки |
| 9-10 | Drag-and-drop розклад |
| 11-12 | Відділи UI + конфлікт-детекція |
| 13-14 | Експорт (PDF/Excel) |
| 15-16 | RBAC + invite system |
| 17-18 | Сповіщення (in-app + email) |
| 19-20 | Time-off requests + approvals |
| 21-24 | PWA + mobile optimization |
| 25+ | Analytics, integrations, billing |

---

## Definition of Done

Кожна фіча вважається завершеною коли:
- [ ] Код написаний та працює
- [ ] Unit тести покривають бізнес-логіку
- [ ] Integration/E2E тест для user flow
- [ ] Код пройшов review
- [ ] Документація оновлена (якщо потрібно)
- [ ] Працює на staging environment
