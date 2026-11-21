/// <reference path="../pb_data/types.d.ts" />
// Схема магазина «Ева Тоха». Публичное чтение, запись только суперпользователю.
migrate(
  (app) => {
    const publicRead = { listRule: '', viewRule: '' };

    app.save(
      new Collection({
        type: 'base',
        name: 'colors',
        listRule: 'active = true',
        viewRule: 'active = true',
        fields: [
          { type: 'text', name: 'name', required: true, max: 60 },
          { type: 'text', name: 'hex', required: true, pattern: '^#[0-9a-fA-F]{6}$' },
          { type: 'select', name: 'usage', required: true, maxSelect: 1, values: ['mat', 'trim', 'both'] },
          { type: 'number', name: 'order' },
          { type: 'bool', name: 'active' },
        ],
      }),
    );

    app.save(
      new Collection({
        type: 'base',
        name: 'trunk_classes',
        ...publicRead,
        fields: [
          { type: 'text', name: 'name', required: true, max: 60 },
          { type: 'number', name: 'area_m2', required: true, min: 0 },
          { type: 'number', name: 'order' },
        ],
      }),
    );

    app.save(
      new Collection({
        type: 'base',
        name: 'photos',
        ...publicRead,
        fields: [
          {
            type: 'file',
            name: 'image',
            required: true,
            maxSelect: 1,
            maxSize: 8 * 1024 * 1024,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            thumbs: ['600x0', '1200x0'],
          },
          { type: 'text', name: 'caption', max: 200 },
          { type: 'number', name: 'order' },
        ],
      }),
    );

    app.save(
      new Collection({
        type: 'base',
        name: 'reviews',
        listRule: 'visible = true',
        viewRule: 'visible = true',
        fields: [
          { type: 'text', name: 'author', required: true, max: 80 },
          { type: 'text', name: 'text', required: true, max: 1000 },
          {
            type: 'file',
            name: 'photo',
            maxSelect: 1,
            maxSize: 8 * 1024 * 1024,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            thumbs: ['600x0'],
          },
          { type: 'bool', name: 'visible' },
          { type: 'number', name: 'order' },
        ],
      }),
    );

    app.save(
      new Collection({
        type: 'base',
        name: 'settings',
        ...publicRead,
        fields: [
          { type: 'text', name: 'shop_name', required: true, max: 80 },
          { type: 'text', name: 'whatsapp', required: true, max: 30 },
          { type: 'number', name: 'lead_days', required: true, min: 0 },
          { type: 'number', name: 'price_interior_borders', required: true, min: 0 },
          { type: 'number', name: 'price_interior_plain', required: true, min: 0 },
          { type: 'number', name: 'trunk_price_per_m2', required: true, min: 0 },
          { type: 'text', name: 'about', max: 2000 },
          { type: 'text', name: 'warranty', max: 1000 },
        ],
      }),
    );
  },
  (app) => {
    for (const name of ['settings', 'reviews', 'photos', 'trunk_classes', 'colors']) {
      app.delete(app.findCollectionByNameOrId(name));
    }
  },
);
