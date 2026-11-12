/* eslint-disable no-console */
// Сид-данные «Отклик»: структура компании, справочники и 20 обращений из датасета
// (+ A-021 как пример дубликата для аналитики повторов).
// Запуск: npm run db:seed  (или npm run db:reset — пересоздать БД и залить заново)

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DAY = 86_400_000;
const now = Date.now();

function ago(days, hour = 10) {
  const d = new Date(now - days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
}
function after(date, days) {
  return new Date(date.getTime() + days * DAY);
}

const SLA_DAYS = { high: 3, mid: 7, low: 14 };

const DEPARTMENTS = [
  "Продажи",
  "Закупки",
  "Проектирование",
  "Техотдел",
  "IT-разработка",
  "Сервис",
  "Управление",
];

const USERS = [
  { key: "admin", name: "Администратор системы", email: "admin@otklik.local", role: "admin", dept: null },
  { key: "head_sales", name: "Руководитель продаж", email: "head.sales@otklik.local", role: "head", dept: "Продажи" },
  { key: "sales", name: "Менеджер по продажам", email: "sales@otklik.local", role: "employee", dept: "Продажи" },
  { key: "contracts", name: "Ответственный за договоры", email: "contracts@otklik.local", role: "employee", dept: "Продажи" },
  { key: "head_purchase", name: "Руководитель закупок", email: "head.purchase@otklik.local", role: "head", dept: "Закупки" },
  { key: "purchase", name: "Сотрудник закупок", email: "purchase@otklik.local", role: "employee", dept: "Закупки" },
  { key: "head_design", name: "Руководитель проектирования", email: "head.design@otklik.local", role: "head", dept: "Проектирование" },
  { key: "nomenclature", name: "Ответственный за номенклатуру", email: "nomenclature@otklik.local", role: "employee", dept: "Проектирование" },
  { key: "design", name: "Сотрудник проектирования", email: "design@otklik.local", role: "employee", dept: "Проектирование" },
  { key: "coordinator", name: "Координатор проекта", email: "coordinator@otklik.local", role: "employee", dept: "Проектирование" },
  { key: "project_lead", name: "Руководитель проекта", email: "project.lead@otklik.local", role: "employee", dept: "Проектирование" },
  { key: "head_tech", name: "Технический руководитель", email: "head.tech@otklik.local", role: "head", dept: "Техотдел" },
  { key: "tech", name: "Технический специалист", email: "tech@otklik.local", role: "employee", dept: "Техотдел" },
  { key: "head_it", name: "Руководитель IT-разработки", email: "head.it@otklik.local", role: "head", dept: "IT-разработка" },
  { key: "it", name: "IT-специалист", email: "it@otklik.local", role: "employee", dept: "IT-разработка" },
  { key: "dev", name: "Разработчик", email: "dev@otklik.local", role: "employee", dept: "IT-разработка" },
  { key: "head_service", name: "Руководитель сервиса", email: "head.service@otklik.local", role: "head", dept: "Сервис" },
  { key: "service", name: "Сервисный инженер", email: "service@otklik.local", role: "employee", dept: "Сервис" },
  { key: "head_admin", name: "Административный руководитель", email: "head.admin@otklik.local", role: "head", dept: "Управление" },
  { key: "hr", name: "HR / внутренние коммуникации", email: "hr@otklik.local", role: "employee", dept: "Управление" },
  { key: "docs", name: "Администратор документов", email: "docs@otklik.local", role: "employee", dept: "Управление" },
  { key: "accountant", name: "Сотрудник бухгалтерии", email: "accountant@otklik.local", role: "employee", dept: "Управление" },
  { key: "office", name: "Сотрудник офиса", email: "office@otklik.local", role: "employee", dept: "Управление" },
  { key: "trainer", name: "Ответственный за обучение", email: "trainer@otklik.local", role: "employee", dept: "Управление" },
];

// Категория → отдел по умолчанию (правило маршрутизации).
// «Интеграции и IT» намеренно ведёт в Закупки — на демо админ меняет правило на IT-разработку.
const CATEGORIES = [
  ["Межотдельное взаимодействие", "Закупки"],
  ["Информационная прозрачность", "Продажи"],
  ["Каталог и данные", "Проектирование"],
  ["Обучение", "Управление"],
  ["Документооборот", "Управление"],
  ["Регламенты", "Управление"],
  ["Интеграции и IT", "Закупки"],
  ["Знания и наставничество", "Управление"],
  ["Договорная работа", "Продажи"],
  ["Задачи и коммуникации", "Продажи"],
  ["Оперативность", "Продажи"],
  ["Коммуникации", "IT-разработка"],
  ["Проектная деятельность", "Проектирование"],
  ["Планирование ресурсов", "Проектирование"],
  ["Постановка задач", "Продажи"],
  ["Корпоративная среда", "Управление"],
  ["Хранение документов", "Управление"],
  ["Прозрачность результатов", "Управление"],
  // «Другое» — без правила: обращение попадает в очередь «Неназначенные».
  ["Другое", null],
];

const APPEALS = [
  {
    code: "A-001", author: "purchase", type: "problem", category: "Межотдельное взаимодействие",
    priority: "mid", status: "new", days: 2,
    text: "В заявках на приобретение оборудования иногда не хватает назначения изделия и требуемых параметров. Предлагаю добавить обязательные поля, чтобы сократить число уточнений.",
  },
  {
    code: "A-002", author: "purchase", type: "proposal", category: "Информационная прозрачность",
    priority: "mid", status: "review", days: 5, firstResponse: 1,
    text: "При общении с поставщиками полезно видеть общую стадию проекта без доступа к коммерческим деталям. Можно ли показывать краткий статус и ориентировочные контрольные даты?",
  },
  {
    code: "A-003", author: "design", type: "problem", category: "Каталог и данные",
    priority: "high", status: "in_work", days: 12, firstResponse: 1, assignee: "nomenclature",
    text: "В рабочих материалах иногда встречаются разные обозначения одного изделия. Это увеличивает время проверки спецификации. Нужен понятный способ находить актуальную карточку позиции.",
  },
  {
    code: "A-004", author: "purchase", type: "proposal", category: "Обучение",
    priority: "low", status: "implemented", days: 30, firstResponse: 2, assignee: "trainer", resolvedDaysAgo: 18,
    text: "Было бы полезно проводить короткие занятия по новым товарным линейкам с разбором типовых запросов. Предлагаю составить календарь таких встреч.",
    result: "Запланирован пробный обучающий семинар по новым товарным линейкам.",
  },
  {
    code: "A-005", author: "accountant", type: "problem", category: "Документооборот",
    priority: "mid", status: "clarification", days: 8, firstResponse: 1,
    text: "При обработке документов между подразделениями возникают дополнительные вопросы о том, на каком этапе находится пакет. Хотелось бы видеть ответственного и текущий статус.",
  },
  {
    code: "A-006", author: "accountant", type: "proposal", category: "Регламенты",
    priority: "mid", status: "review", days: 6, firstResponse: 1,
    text: "Предлагаю собрать короткую пошаговую памятку для операций, в которых последовательно участвуют несколько подразделений, и определить порядок актуализации памятки.",
  },
  {
    code: "A-007", author: "accountant", type: "problem", category: "Интеграции и IT",
    priority: "high", status: "new", days: 1,
    text: "Иногда повторный ввод одних и тех же сведений в разных рабочих системах занимает много времени. Нужна оценка, какие операции можно синхронизировать безопасно.",
  },
  {
    code: "A-008", author: "accountant", type: "proposal", category: "Знания и наставничество",
    priority: "low", status: "implemented", days: 25, firstResponse: 2, assignee: "hr", resolvedDaysAgo: 15,
    text: "При передаче сложной задачи новому сотруднику полезен короткий разбор типовых ошибок и контактов, к которым можно обратиться за помощью. Предлагаю сделать такую памятку.",
    result: "Создана учебная инструкция с разбором типовых ошибок и контактами для консультаций.",
  },
  {
    code: "A-009", author: "sales", type: "problem", category: "Договорная работа",
    priority: "high", status: "in_work", days: 9, firstResponse: 1, assignee: "contracts",
    text: "Не всегда понятно, кто готовит очередную версию приложения к договору и кто должен проверить её перед отправкой. Это приводит к повторным согласованиям.",
  },
  {
    code: "A-010", author: "sales", type: "proposal", category: "Задачи и коммуникации",
    priority: "mid", status: "review", days: 7, firstResponse: 1,
    text: "Предлагаю не закрывать рабочую задачу до подтверждения заказчиком результата внутри компании, чтобы связанные вопросы оставались в общей истории обсуждения.",
  },
  {
    code: "A-011", author: "sales", type: "problem", category: "Оперативность",
    priority: "high", status: "new", days: 3,
    text: "При срочной подготовке клиентского предложения сложно прогнозировать сроки ответа от смежных подразделений. Хотелось бы видеть ожидаемый срок и уведомление при задержке.",
  },
  {
    code: "A-012", author: "sales", type: "proposal", category: "Коммуникации",
    priority: "low", status: "review", days: 10, firstResponse: 2,
    text: "Рабочие обсуждения распределены по нескольким каналам, из-за чего теряется контекст. Предлагаю выбрать единое место для итоговых решений по задаче.",
  },
  {
    code: "A-013", author: "coordinator", type: "problem", category: "Проектная деятельность",
    priority: "mid", status: "clarification", days: 11, firstResponse: 2,
    text: "Когда изменяется состав оборудования в проекте, не всегда ясно, какие строки спецификации были пересмотрены. Нужна более заметная история изменений.",
  },
  {
    code: "A-014", author: "coordinator", type: "proposal", category: "Планирование ресурсов",
    priority: "mid", status: "review", days: 4, firstResponse: 1,
    text: "Предлагаю показывать загруженность проектной группы на ближайшие недели в укрупнённом виде. Так будет проще согласовывать сроки запуска новых задач.",
  },
  {
    code: "A-015", author: "project_lead", type: "problem", category: "Постановка задач",
    priority: "mid", status: "in_work", days: 4, firstResponse: 1, assignee: "sales",
    text: "Некоторые поручения поступают без ожидаемого результата и даты завершения. Предлагаю договориться о минимальном наборе данных при постановке задачи.",
  },
  {
    code: "A-016", author: "project_lead", type: "proposal", category: "Обучение",
    priority: "low", status: "new", days: 2,
    text: "Для новых сотрудников полезны практические демонстрации оборудования, а не только презентации. Предлагаю пилотное занятие с учебными образцами.",
  },
  {
    code: "A-017", author: "office", type: "proposal", category: "Корпоративная среда",
    priority: "low", status: "rejected", days: 20, firstResponse: 4, rejectedDaysAgo: 15,
    text: "Предлагаю организовать отдельную небольшую зону для коротких перерывов рядом с рабочими помещениями.",
    rejectReason: "Сейчас нет подходящего помещения для отдельной зоны отдыха. Вернуться к вопросу при следующей перепланировке офиса.",
  },
  {
    code: "A-018", author: "office", type: "praise", category: "Корпоративная среда",
    priority: "low", status: "closed", days: 28, firstResponse: 2, assignee: "hr", resolvedDaysAgo: 20, closedDaysAgo: 18, rating: 5,
    text: "Хочу отметить пользу внутренних учебных встреч: после них стало легче обращаться к коллегам за консультацией. Было бы хорошо сохранить этот формат.",
    result: "Отзыв зафиксирован и передан организаторам обучения; формат внутренних встреч сохранён.",
  },
  {
    code: "A-019", author: "coordinator", type: "problem", category: "Хранение документов",
    priority: "mid", status: "review", days: 9, firstResponse: 2,
    text: "В общих папках трудно быстро определить актуальную редакцию инструкции. Можно ли закрепить единые правила именования и архивирования старых версий?",
  },
  {
    code: "A-020", author: "purchase", type: "proposal", category: "Прозрачность результатов",
    priority: "low", status: "new", days: 1,
    text: "Предлагаю публиковать краткий обзор завершённых внутренних улучшений, чтобы сотрудники видели результат направленных предложений.",
  },
];

async function main() {
  console.log("Очистка БД…");
  await prisma.notification.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.appealSubscription.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.appealHistory.deleteMany();
  await prisma.appeal.deleteMany();
  await prisma.routingRule.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const passwordHash = bcrypt.hashSync("demo1234", 10);

  const departments = {};
  for (const name of DEPARTMENTS) {
    departments[name] = await prisma.department.create({ data: { name } });
  }

  const users = {};
  for (const u of USERS) {
    users[u.key] = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        departmentId: u.dept ? departments[u.dept].id : null,
      },
    });
  }

  for (const [name, dept] of Object.entries(departments)) {
    const head = USERS.find((u) => u.role === "head" && u.dept === name);
    if (head) {
      await prisma.department.update({
        where: { id: dept.id },
        data: { headId: users[head.key].id },
      });
    }
  }

  const categories = {};
  for (const [name, deptName] of CATEGORIES) {
    const category = await prisma.category.create({ data: { name } });
    categories[name] = category;
    if (!deptName) continue; // «Другое»: без правила маршрутизации.
    await prisma.routingRule.create({
      data: {
        categoryId: category.id,
        departmentId: departments[deptName].id,
        weight: 10,
        isActive: true,
      },
    });
  }

  const headOf = {};
  for (const [name, dept] of Object.entries(departments)) {
    const head = USERS.find((u) => u.role === "head" && u.dept === name);
    headOf[name] = head ? users[head.key].id : null;
  }

  const created = {};
  const defaults = [];

  for (const a of APPEALS) {
    const category = categories[a.category];
    const rule = CATEGORIES.find(([name]) => name === a.category);
    const deptName = rule ? rule[1] : null;
    const department = deptName ? departments[deptName] : null;
    const responsibleId = deptName ? headOf[deptName] : null;
    const assigneeId = a.assignee ? users[a.assignee].id : null;

    const createdAt = ago(a.days);
    const firstResponseAt = a.firstResponse ? after(createdAt, a.firstResponse) : null;
    const deadline =
      a.status === "in_work" || a.status === "implemented" || a.status === "closed"
        ? after(createdAt, SLA_DAYS[a.priority])
        : null;
    const resolvedAt = a.resolvedDaysAgo != null ? ago(a.resolvedDaysAgo) : null;
    const closedAt = a.closedDaysAgo != null ? ago(a.closedDaysAgo) : null;

    const appeal = await prisma.appeal.create({
      data: {
        code: a.code,
        authorId: users[a.author].id,
        type: a.type,
        categoryId: category.id,
        priority: a.priority,
        text: a.text,
        proposal: a.type === "proposal" ? a.text : null,
        departmentId: department ? department.id : null,
        responsibleId,
        assigneeId,
        status: a.status,
        deadline,
        result: a.result ?? null,
        rejectReason: a.rejectReason ?? null,
        createdAt,
        publishedAt: createdAt,
        firstResponseAt,
        resolvedAt,
        closedAt,
        redirectCount: 0,
      },
    });
    created[a.code] = appeal;
    defaults.push({ appeal, a, responsibleId, assigneeId, createdAt, resolvedAt, closedAt });
  }

  // История: собираем после создания всех обращений (нужны id).
  for (const { appeal, a, responsibleId, assigneeId, createdAt, resolvedAt, closedAt } of defaults) {
    const events = [];
    let t = createdAt.getTime();
    const at = (days) => new Date((t += days * DAY));

    events.push({
      event: "published",
      toStatus: "new",
      actorId: users[a.author].id,
      comment: "Обращение зарегистрировано",
      createdAt,
    });

    if (a.status !== "new") {
      events.push({
        event: "status_changed",
        fromStatus: "new",
        toStatus: "review",
        actorId: responsibleId,
        createdAt: at(1),
      });
    }

    if (a.status === "clarification") {
      events.push({
        event: "clarification",
        fromStatus: "review",
        toStatus: "clarification",
        actorId: responsibleId,
        comment: "Запрошены уточняющие сведения у автора",
        createdAt: at(2),
      });
    }

    if (a.status === "in_work" || a.status === "implemented" || a.status === "closed") {
      events.push({
        event: "assigned",
        fromStatus: a.status === "in_work" || a.status === "implemented" || a.status === "closed" ? "review" : "new",
        toStatus: "in_work",
        actorId: responsibleId,
        comment: assigneeId ? "Назначен исполнитель и срок" : "Взято в работу",
        createdAt: at(2),
      });
    }

    if (a.status === "implemented") {
      events.push({
        event: "resolved",
        fromStatus: "in_work",
        toStatus: "implemented",
        actorId: assigneeId ?? responsibleId,
        comment: a.result,
        createdAt: resolvedAt,
      });
    }

    if (a.status === "closed") {
      events.push({
        event: "resolved",
        fromStatus: "in_work",
        toStatus: "implemented",
        actorId: assigneeId ?? responsibleId,
        comment: a.result,
        createdAt: resolvedAt,
      });
      events.push({
        event: "rated",
        fromStatus: "implemented",
        toStatus: "implemented",
        actorId: users[a.author].id,
        comment: "Автор оценил итог: 5 из 5",
        createdAt: closedAt,
      });
      events.push({
        event: "status_changed",
        fromStatus: "implemented",
        toStatus: "closed",
        actorId: users[a.author].id,
        comment: "Обращение закрыто",
        createdAt: closedAt,
      });
    }

    if (a.status === "rejected") {
      events.push({
        event: "rejected",
        fromStatus: "review",
        toStatus: "rejected",
        actorId: responsibleId,
        comment: a.rejectReason,
        createdAt: ago(a.rejectedDaysAgo),
      });
    }

    for (const e of events) {
      await prisma.appealHistory.create({
        data: {
          appealId: appeal.id,
          actorId: e.actorId ?? null,
          event: e.event,
          fromStatus: e.fromStatus ?? null,
          toStatus: e.toStatus ?? null,
          comment: e.comment ?? null,
          createdAt: e.createdAt ?? createdAt,
        },
      });
    }
  }

  // Комментарии
  const COMMENT_DATA = [
    ["A-001", "head_purchase", "Запросили пример корректно заполненной заявки, оценим изменение шаблона.", 1, false],
    ["A-003", "head_design", "Проверяем справочник номенклатуры, первые расхождения уже нашли.", 5, false],
    ["A-005", "head_admin", "Уточните, пожалуйста, о каких видах документов идёт речь и на каких этапах согласования чаще всего возникают вопросы.", 2, true],
    ["A-009", "head_sales", "Разграничили этапы: подготовку ведёт менеджер, проверку — ответственный за договоры.", 4, false],
    ["A-013", "head_design", "Подскажите формат исходных файлов спецификаций — от этого зависит способ сравнения версий.", 2, true],
    ["A-017", "head_admin", "Сейчас нет подходящего помещения для отдельной зоны отдыха. Вернуться к вопросу при следующей перепланировке офиса.", 3, false],
  ];
  for (const [code, author, text, daysAfter, isClarification] of COMMENT_DATA) {
    const appeal = created[code];
    await prisma.comment.create({
      data: {
        appealId: appeal.id,
        authorId: users[author].id,
        text,
        isClarification,
        createdAt: after(appeal.createdAt, daysAfter),
      },
    });
  }

  // Оценка
  await prisma.rating.create({
    data: {
      appealId: created["A-018"].id,
      authorId: users.office.id,
      score: 5,
      comment: "Спасибо за формат — очень помогает в работе.",
      createdAt: after(created["A-018"].createdAt, 10),
    },
  });

  // Дубликат: A-021 повторяет A-004 (тема обучения), автор подписан на оригинал.
  const dup = await prisma.appeal.create({
    data: {
      code: "A-021",
      authorId: users.office.id,
      type: "proposal",
      categoryId: categories["Обучение"].id,
      priority: "low",
      text: "Предлагаю проводить короткие практические занятия по новой технике для сотрудников офиса.",
      proposal: "Предлагаю проводить короткие практические занятия по новой технике для сотрудников офиса.",
      departmentId: departments["Управление"].id,
      responsibleId: headOf["Управление"],
      status: "duplicate",
      duplicateOfId: created["A-004"].id,
      createdAt: ago(3),
      publishedAt: ago(3),
      firstResponseAt: after(ago(3), 1),
    },
  });
  await prisma.appealHistory.createMany({
    data: [
      {
        appealId: dup.id,
        actorId: users.office.id,
        event: "published",
        toStatus: "new",
        comment: "Обращение зарегистрировано",
        createdAt: ago(3),
      },
      {
        appealId: dup.id,
        actorId: headOf["Управление"],
        event: "duplicate",
        fromStatus: "review",
        toStatus: "duplicate",
        comment: "Дубликат обращения A-004",
        createdAt: ago(2),
      },
    ],
  });
  await prisma.appealSubscription.create({
    data: { appealId: created["A-004"].id, userId: users.office.id },
  });

  // Уведомления
  const NOTIFICATIONS = [
    ["head_purchase", "A-001", "new", "Новое обращение A-001 в вашем отделе"],
    ["head_purchase", "A-007", "new", "Новое обращение A-007 в вашем отделе"],
    ["head_sales", "A-011", "new", "Новое обращение A-011 в вашем отделе"],
    ["head_design", "A-016", "new", "Новое обращение A-016 в вашем отделе"],
    ["head_purchase", "A-020", "new", "Новое обращение A-020 в вашем отделе"],
    ["purchase", "A-004", "implemented", "A-004 реализовано: запланирован обучающий семинар"],
    ["accountant", "A-005", "clarification", "A-005: требуется уточнение"],
    ["coordinator", "A-013", "clarification", "A-013: требуется уточнение"],
    ["office", "A-017", "rejected", "A-017 отклонено: есть мотивированный ответ"],
    ["office", "A-018", "closed", "A-018 закрыто. Спасибо за оценку!"],
    ["accountant", "A-008", "implemented", "A-008 реализовано: создана учебная инструкция"],
    ["nomenclature", "A-003", "assigned", "A-003 назначено на вас"],
  ];
  for (const [userKey, code, event, message] of NOTIFICATIONS) {
    await prisma.notification.create({
      data: {
        userId: users[userKey].id,
        appealId: created[code]?.id ?? dup.id,
        event,
        message,
        isRead: false,
        createdAt: ago(1),
      },
    });
  }

  const counts = {
    departments: await prisma.department.count(),
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    routingRules: await prisma.routingRule.count(),
    appeals: await prisma.appeal.count(),
    history: await prisma.appealHistory.count(),
    comments: await prisma.comment.count(),
    notifications: await prisma.notification.count(),
  };
  console.log("Готово:", counts);
  console.log("Демо-пароль для всех учётных записей: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
