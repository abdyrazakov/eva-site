/// <reference path="../pb_data/types.d.ts" />
// Начальные данные: 11 цветов, 4 класса багажника, настройки. Всё правится в админке.
migrate(
  (app) => {
    const add = (collectionName, data) => {
      const record = new Record(app.findCollectionByNameOrId(collectionName));
      for (const [key, value] of Object.entries(data)) record.set(key, value);
      app.save(record);
    };

    const colors = [
      ['Красный', '#E53935'],
      ['Оранжевый', '#FB8C00'],
      ['Жёлтый', '#FDD835'],
      ['Зелёный', '#43A047'],
      ['Голубой', '#29B6F6'],
      ['Синий', '#1E4FD8'],
      ['Фиолетовый', '#8E24AA'],
      ['Чёрный', '#111111'],
      ['Серый', '#8D8D8D'],
      ['Белый', '#F5F5F5'],
      ['Розовый', '#EC407A'],
    ];
    colors.forEach(([name, hex], index) =>
      add('colors', { name, hex, usage: 'both', order: index + 1, active: true }),
    );

    const trunkClasses = [
      ['Седан', 1.0],
      ['Кроссовер', 1.3],
      ['Универсал', 1.6],
      ['Минивэн', 1.8],
    ];
    trunkClasses.forEach(([name, area], index) =>
      add('trunk_classes', { name, area_m2: area, order: index + 1 }),
    );

    add('settings', {
      shop_name: 'Ева Тоха',
      whatsapp: '996000000000',
      lead_days: 1,
      price_interior_borders: 2200,
      price_interior_plain: 1700,
      trunk_price_per_m2: 1300,
      about: 'Режем EVA-коврики и шьём кант вручную в собственном цехе.',
      warranty: 'Гарантия на пошив канта и качество материала.',
    });
  },
  (app) => {
    for (const name of ['colors', 'trunk_classes', 'settings']) {
      app.truncateCollection(app.findCollectionByNameOrId(name));
    }
  },
);
