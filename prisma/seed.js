const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SINO database...');

  // Common dev password: "Password123!"
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. System Settings
  const settings = [
    { key: 'MINIMUM_AGE', value: '18', description: 'Минимальный допустимый возраст пользователя' },
    { key: 'DEFAULT_LANGUAGE', value: 'ru', description: 'Язык по умолчанию' },
    { key: 'ENABLE_AI', value: 'true', description: 'Главный выключатель (Kill Switch) для ИИ' },
    { key: 'ENABLE_HUMAN_SUPPORT', value: 'true', description: 'Главный выключатель для поддержки живыми людьми' },
    { key: 'ENABLE_VOLUNTEER_REGISTRATION', value: 'true', description: 'Приём заявок от волонтёров' },
    { key: 'ENABLE_PROFESSIONAL_REGISTRATION', value: 'true', description: 'Приём заявок от специалистов' },
    { key: 'RETENTION_AI_DAYS', value: '90', description: 'Срок хранения диалогов с ИИ в днях' },
    { key: 'RETENTION_HUMAN_DAYS', value: '180', description: 'Срок хранения диалогов с людьми в днях' },
    { key: 'RETENTION_AUDIT_DAYS', value: '365', description: 'Срок хранения аудит-логов в днях' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 2. Crisis Resources (Kazakhstan & Emergency)
  const crisisList = [
    {
      country: 'KZ',
      language: 'ru',
      resourceType: 'EMERGENCY',
      name: 'Единая служба экстренной помощи Казахстана',
      phone: '112',
      url: 'https://www.gov.kz',
      description: 'Бесплатный экстренный вызов при прямой угрозе жизни и здоровью (круглосуточно)',
      order: 1,
    },
    {
      country: 'KZ',
      language: 'ru',
      resourceType: 'HOTLINE',
      name: 'Национальная линия доверия по Казахстану',
      phone: '150',
      url: 'https://telefon150.kz',
      description: 'Анонимная и бесплатная психологическая помощь для детей и молодежи, круглосуточно',
      order: 2,
    },
    {
      country: 'KZ',
      language: 'ru',
      resourceType: 'HOTLINE',
      name: 'Единый контакт-центр психологической помощи 111',
      phone: '111',
      url: 'https://111.kz',
      description: 'Государственная линия поддержки по вопросам прав человека, безопасности и кризисных ситуаций',
      order: 3,
    },
    {
      country: 'KZ',
      language: 'ru',
      resourceType: 'CENTER',
      name: 'Республиканский научно-практический центр психического здоровья',
      phone: '+7 (727) 376-53-00',
      url: 'https://mentalcenter.kz',
      description: 'Консультации профильных специалистов в сфере психического здоровья',
      order: 4,
    },
  ];

  for (const c of crisisList) {
    const existing = await prisma.crisisResource.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.crisisResource.create({ data: c });
    }
  }

  // 3. Training Courses and 10 Modules
  const course = await prisma.trainingCourse.upsert({
    where: { id: 'course-vol-01' },
    update: {},
    create: {
      id: 'course-vol-01',
      title: 'Программа подготовки волонтёра эмоциональной поддержки СИНО',
      description: 'Обязательный обучающий курс из 10 модулей по этике, активному слушанию и безопасности.',
      order: 1,
    },
  });

  const modulesData = [
    {
      order: 1,
      title: '1. Основы активного слушания',
      content: `### Принципы активного слушания в СИНО
Активное слушание — это не просто молчание, а внимательное присутствие.
1. **Безоценочность**: Мы не оцениваем поступки и эмоции («ты зря так думаешь», «это ерунда»).
2. **Отражение чувств**: Называйте эмоции («похоже, тебе сейчас очень обидно», «слышу, как ты устал»).
3. **Открытые вопросы**: «Что помогло бы тебе сейчас почувствовать себя чуть спокойнее?» вместо «Ты плакал?».
4. **Паузы**: Давайте человеку время собраться с мыслями.`,
      quizJson: JSON.stringify({
        question: 'Пользователь пишет: «Мне кажется, я всё делаю не так и всех подвожу». Какой ответ наиболее точно соответствует активному слушанию?',
        options: [
          'Не переживай, у всех бывают такие дни, всё наладится!',
          'Слышу, как много вины и усталости в твоих словах. Расскажи, если хочешь, что произошло?',
          'Тебе нужно просто составить список дел и меньше думать о других.',
          'Почему ты так думаешь? Это нерационально.'
        ],
        correctIndex: 1
      })
    },
    {
      order: 2,
      title: '2. Границы в эмоциональной поддержке',
      content: `### Установление и сохранение личных границ
1. Волонтёр — не врач, не спасатель и не личный друг.
2. Не переходите на личное общение вне платформы.
3. Не берите на себя ответственность за выбор и жизнь другого человека.
4. Вы имеете право завершить или передать диалог при агрессии или нарушении границ.`,
      quizJson: JSON.stringify({
        question: 'Пользователь просит ваш личный Telegram: «Мне так легче общаться, здесь неудобно». Ваши действия?',
        options: [
          'Дать Telegram, если пользователь в тяжелом состоянии.',
          'Мягко напомнить о правилах платформы: общение происходит только здесь ради безопасности обоих.',
          'Сразу заблокировать пользователя без объяснений.',
          'Передать свой номер телефона.'
        ],
        correctIndex: 1
      })
    },
    {
      order: 3,
      title: '3. Что нельзя говорить и опасные фразы',
      content: `### Запрещенные формулировки:
- «Всё будет хорошо» (обесценивание и ложная гарантия)
- «Подумай о тех, кому хуже» (токсичный позитив)
- «Ты сам(а) виноват(а)» (виктимблейминг)
- «Тебе просто надо заняться спортом / выспаться»
- «Я знаю, каково тебе» (опыт каждого уникален)`,
      quizJson: JSON.stringify({
        question: 'Какая фраза является запрещенной в СИНО?',
        options: [
          'Я рядом и готов(а) выслушать тебя.',
          'Похоже, эта ситуация очень ранит.',
          'Подумай о том, как тяжело детям в Африке, твоя проблема — мелочь.',
          'Если захочешь сделать паузу, скажи мне.'
        ],
        correctIndex: 2
      })
    },
    {
      order: 4,
      title: '4. Как не давать ложные гарантии (Reassurance Loop)',
      content: `### Предотвращение зацикливания на заверениях
Когда человек в панике или обсессии постоянно спрашивает: «Точно всё обойдётся? Точно никто не умрёт?», многократное «Да, точно» не снижает тревогу, а усиливает цикл зависимости.
**Что делать:**
- Валидировать тревогу: «Я понимаю, насколько силен страх неопределенности прямо сейчас».
- Возвращать в здесь-и-сейчас: «Ни один человек не может гарантировать будущее на 100%, но сейчас мы здесь, и ты в безопасности».`,
      quizJson: JSON.stringify({
        question: 'Пользователь пятый раз подряд спрашивает: «Поклянись, что завтра ничего плохого не случится!». Как ответить?',
        options: [
          'Клянусь, всё будет отлично!',
          'Слышу, как высок уровень тревоги и как хочется абсолютной гарантии. Мы не можем контролировать всё завтра, но давай посмотрим, что поможет тебе заземлиться прямо сейчас.',
          'Перестаньте задавать глупые вопросы.',
          'Проигнорировать сообщение.'
        ],
        correctIndex: 1
      })
    },
    {
      order: 5,
      title: '5. Работа с тревогой и паникой',
      content: `### Техники заземления:
1. **Дыхание 4-4-4-4 (по квадрату)** или удлиненный выдох.
2. **Техника 5-4-3-2-1**:
   - 5 предметов, которые ты видишь;
   - 4 вещи, которые можешь потрогать;
   - 3 звука вокруг;
   - 2 запаха;
   - 1 вкус или ощущение тела.
3. Физическая опора: почувствовать стопами пол, спиной спинку стула.`,
      quizJson: JSON.stringify({
        question: 'Пользователь сообщает, что задыхается от панической атаки. С чего стоит начать?',
        options: [
          'Предложить глубоко проанализировать детские травмы.',
          'Предложить простое физическое заземление: почувствовать стопы на полу и сделать плавный длинный выдох.',
          'Сказать: «Успокойся, это всё у тебя в голове».',
          'Позвонить в полицию.'
        ],
        correctIndex: 1
      })
    },
    {
      order: 6,
      title: '6. Работа с конфликтами и агрессией',
      content: `### Не принимайте агрессию на свой счёт
1. Агрессия часто является защитной реакцией на боль, беспомощность или страх.
2. Не вступайте в спор и не оправдывайтесь.
3. Обозначьте границы спокойно: «Я искренне хочу поддержать тебя, но мне трудно продолжать диалог в таком тоне. Давай сосредоточимся на том, что тебя беспокоит».`,
      quizJson: JSON.stringify({
        question: 'Пользователь грубо оскорбляет вас в чате. Правильный порядок действий:',
        options: [
          'Оскорбить в ответ, чтобы защитить честь.',
          'Спокойно обозначить границы, при повторении — завершить/эскалировать диалог и оформить репорт.',
          'Продолжать унижаться и извиняться.',
          'Удалить аккаунт.'
        ],
        correctIndex: 1
      })
    },
    {
      order: 7,
      title: '7. Когда передавать обращение (Case Transfer)',
      content: `### Основания для передачи обращения:
- Тема триггерит ваш личный непроработанный опыт (вы чувствуете, что эмоционально не справляетесь).
- Пользователь требует профессиональной психотерапевтической помощи, выходящей за рамки поддержки.
- Высокая когнитивная перегрузка или окончание смены.`,
      quizJson: JSON.stringify({
        question: 'Вы чувствуете сильный эмоциональный перегруз и не можете объективно слышать собеседника. Что делать?',
        options: [
          'Резко закрыть вкладку и уйти спать.',
          'Воспользоваться кнопкой «Передать обращение», указав объективную причину координатору.',
          'Нагрубить собеседнику.',
          'Притвориться, что пропал интернет.'
        ],
        correctIndex: 1
      })
    },
    {
      order: 8,
      title: '8. Crisis escalation (Действия в кризисных ситуациях)',
      content: `### Протокол высокого риска (суицидальные намерения / угроза жизни):
1. **Не обесценивайте и не пугайтесь**.
2. **Не давайте обещаний «никому не рассказывать» ценой жизни человека**.
3. **Нажмите кнопку «Эскалировать»** для подключения координатора и старшего специалиста.
4. Предоставьте экстренный контакт: **112** (Казахстан) и горячие линии.
5. Предложите не оставаться в одиночестве в ближайшие 15-30 минут.`,
      quizJson: JSON.stringify({
        question: 'Пользователь прямо заявляет о намерении причинить себе вред в ближайшие минуты. Первое действие волонтёра:',
        options: [
          'Начать спорить о ценности жизни и религиозных нормах.',
          'Активировать кризисную эскалацию, дать контакты экстренных служб (112), оставаться на связи без паники и привлечь координатора.',
          'Сказать «ты просто привлекаешь внимание».',
          'Сразу отключиться от чата.'
        ],
        correctIndex: 1
      })
    },
    {
      order: 9,
      title: '9. Конфиденциальность данных',
      content: `### Принципы приватности:
- Никакие истории, скриншоты, цитаты из чатов не выносятся наружу.
- Публичные анонимные идентификаторы (SINO-XXXXXX) защищают приватность пользователей.
- Все действия с обращениями логируются в защищённый журнал аудита.`,
      quizJson: JSON.stringify({
        question: 'Можно ли сделать скриншот интересного диалога и анонимно выложить в соцсети?',
        options: [
          'Да, если замазать имя.',
          'Категорически запрещено: это грубейшее нарушение тайны обращения и правил платформы.',
          'Да, если спросить разрешение у друга.',
          'Да, если диалог был смешным.'
        ],
        correctIndex: 1
      })
    },
    {
      order: 10,
      title: '10. Правила и этика платформы СИНО',
      content: `### Завершающий модуль: Этика СИНО
- Девиз: «Слушаем и не осуждаем».
- Мы создаем теплое, безопасное пространство без менторства и нравоучений.
- Поздравляем с прохождением теоретической части! После успешной сдачи тестов координаторы проверят вашу заявку.`,
      quizJson: JSON.stringify({
        question: 'В чём заключается главная миссия платформы СИНО?',
        options: [
          'Выдавать всем диагнозы и рецепты.',
          'Предоставить безопасное пространство, где человека готовы бережно выслушать без осуждения и непрошеных советов.',
          'Заменить профессиональную медицину.',
          'Организовывать онлайн-споры.'
        ],
        correctIndex: 1
      })
    },
  ];

  for (const m of modulesData) {
    const existing = await prisma.trainingModule.findFirst({
      where: { courseId: course.id, order: m.order }
    });
    if (!existing) {
      await prisma.trainingModule.create({
        data: {
          courseId: course.id,
          order: m.order,
          title: m.title,
          content: m.content,
          quizJson: m.quizJson,
        }
      });
    }
  }

  // 4. Seed Accounts
  // A. Admin Bootstrap (SUPER_ADMIN)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sino.kz' },
    update: {},
    create: {
      email: 'admin@sino.kz',
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      anonymousId: 'SINO-ADMIN-01',
      profile: {
        create: {
          displayName: 'Главный Администратор',
          themePreference: 'NIGHT',
          language: 'ru',
        }
      }
    }
  });

  // B. Moderator
  await prisma.user.upsert({
    where: { email: 'moderator@sino.kz' },
    update: {},
    create: {
      email: 'moderator@sino.kz',
      passwordHash,
      role: 'MODERATOR',
      status: 'ACTIVE',
      isEmailVerified: true,
      anonymousId: 'SINO-MOD-01',
      profile: {
        create: {
          displayName: 'Дежурный Модератор',
          themePreference: 'NIGHT',
          language: 'ru',
        }
      }
    }
  });

  // C. Coordinator
  const coordUser = await prisma.user.upsert({
    where: { email: 'coordinator@sino.kz' },
    update: {},
    create: {
      email: 'coordinator@sino.kz',
      passwordHash,
      role: 'COORDINATOR',
      status: 'ACTIVE',
      isEmailVerified: true,
      anonymousId: 'SINO-COORD-01',
      profile: {
        create: {
          displayName: 'Елена (Направляющий)',
          bio: 'Координатор службы поддержки СИНО',
          themePreference: 'NIGHT',
          language: 'ru',
        }
      }
    }
  });

  // D. Volunteers
  const vol1 = await prisma.user.upsert({
    where: { email: 'volunteer1@sino.kz' },
    update: {},
    create: {
      email: 'volunteer1@sino.kz',
      passwordHash,
      role: 'VOLUNTEER',
      status: 'ACTIVE',
      isEmailVerified: true,
      anonymousId: 'SINO-VOL-01',
      profile: {
        create: {
          displayName: 'Алекс',
          bio: 'Волонтёр эмоциональной поддержки',
          themePreference: 'NIGHT',
          language: 'ru',
        }
      },
      volunteerProfile: {
        create: {
          status: 'APPROVED',
          availability: 'AVAILABLE',
          maxActiveConversations: 2,
          activeConversationsCount: 0,
          fullName: 'Алексей Ким',
          education: 'Высшее, Психология',
          university: 'КазНУ им. аль-Фараби',
          motivation: 'Хочу помогать людям в трудные минуты жизни',
          languages: 'ru, kk',
          approvedBy: adminUser.id,
          approvedAt: new Date(),
        }
      },
      volunteerProgress: {
        create: {
          completedModules: 10,
          totalModules: 10,
          trainingCompleted: true,
        }
      }
    }
  });

  const vol2 = await prisma.user.upsert({
    where: { email: 'volunteer2@sino.kz' },
    update: {},
    create: {
      email: 'volunteer2@sino.kz',
      passwordHash,
      role: 'VOLUNTEER',
      status: 'ACTIVE',
      isEmailVerified: true,
      anonymousId: 'SINO-VOL-02',
      profile: {
        create: {
          displayName: 'Дана',
          bio: 'Волонтёр поддержки',
          themePreference: 'NIGHT',
          language: 'ru',
        }
      },
      volunteerProfile: {
        create: {
          status: 'APPROVED',
          availability: 'AVAILABLE',
          maxActiveConversations: 2,
          activeConversationsCount: 0,
          fullName: 'Дана Муратова',
          education: 'Студентка 4 курса психологии',
          university: 'ЕНУ им. Гумилева',
          motivation: 'Верю в силу эмпатии и бережного выслушивания',
          languages: 'ru, kk, en',
          approvedBy: adminUser.id,
          approvedAt: new Date(),
        }
      },
      volunteerProgress: {
        create: {
          completedModules: 10,
          totalModules: 10,
          trainingCompleted: true,
        }
      }
    }
  });

  // E. Professional Psychologist
  await prisma.user.upsert({
    where: { email: 'psychologist@sino.kz' },
    update: {},
    create: {
      email: 'psychologist@sino.kz',
      passwordHash,
      role: 'PROFESSIONAL',
      status: 'ACTIVE',
      isEmailVerified: true,
      anonymousId: 'SINO-PRO-01',
      profile: {
        create: {
          displayName: 'Анна Сергеева',
          bio: 'Клинический психолог, КПТ-специалист',
          themePreference: 'NIGHT',
          language: 'ru',
        }
      },
      professionalProfile: {
        create: {
          displayName: 'Анна Сергеева',
          education: 'Магистратура клинической психологии, МГУ / КазНУ',
          qualification: 'Сертифицированный когнитивно-поведенческий психолог, стаж 7 лет',
          specializations: 'Тревожные расстройства, кризисные состояния, эмоциональное выгорание',
          registrationIdentifier: 'KZ-PSY-89421',
          verificationStatus: 'VERIFIED',
          verifiedBy: adminUser.id,
          verifiedAt: new Date(),
          availability: 'AVAILABLE',
          maxActiveConversations: 3,
          activeConversationsCount: 0,
        }
      }
    }
  });

  // F. Regular Test User
  const testUser = await prisma.user.upsert({
    where: { email: 'user@sino.kz' },
    update: {},
    create: {
      email: 'user@sino.kz',
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
      isEmailVerified: true,
      anonymousId: 'SINO-USER-01',
      profile: {
        create: {
          displayName: 'Гость',
          themePreference: 'NIGHT',
          language: 'ru',
        }
      },
      consents: {
        create: [
          { consentType: 'TERMS', documentVersion: '1.0' },
          { consentType: 'PRIVACY', documentVersion: '1.0' },
          { consentType: 'AI_ACKNOWLEDGEMENT', documentVersion: '1.0' },
          { consentType: 'LIMITATIONS', documentVersion: '1.0' },
          { consentType: 'HUMAN_RULES', documentVersion: '1.0' },
        ]
      }
    }
  });

  // Create a default initial AI Chat for test user matching the visual reference dialogue
  const existingChat = await prisma.aIChat.findFirst({ where: { userId: testUser.id } });
  if (!existingChat) {
    const aiChat = await prisma.aIChat.create({
      data: {
        userId: testUser.id,
        title: 'Первый разговор',
        mode: 'LISTENING',
      }
    });

    await prisma.aIMessage.createMany({
      data: [
        {
          chatId: aiChat.id,
          senderType: 'USER',
          content: 'Мне очень тяжело в последнее время. Я не знаю, что делать.',
          createdAt: new Date(Date.now() - 120000),
        },
        {
          chatId: aiChat.id,
          senderType: 'AI',
          content: 'Спасибо, что поделился(ась). Я слушаю тебя. Можешь рассказать подробнее, если хочешь. Я здесь.',
          createdAt: new Date(Date.now() - 90000),
        },
        {
          chatId: aiChat.id,
          senderType: 'USER',
          content: 'Я чувствую себя одиноко и никому не нужным(ой).',
          createdAt: new Date(Date.now() - 60000),
        },
        {
          chatId: aiChat.id,
          senderType: 'AI',
          content: 'Мне очень жаль, что тебе сейчас так больно. Ты важен(на), и твои чувства имеют значение. Давай попробуем вместе разобраться, что происходит?',
          createdAt: new Date(Date.now() - 30000),
        },
      ]
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log('--- Development Accounts (Password: Password123!) ---');
  console.log('👑 Admin:        admin@sino.kz');
  console.log('🧭 Coordinator:  coordinator@sino.kz');
  console.log('🤝 Volunteer 1:  volunteer1@sino.kz');
  console.log('🤝 Volunteer 2:  volunteer2@sino.kz');
  console.log('🎓 Psychologist: psychologist@sino.kz');
  console.log('🛡️ Moderator:    moderator@sino.kz');
  console.log('👤 Regular User: user@sino.kz');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });