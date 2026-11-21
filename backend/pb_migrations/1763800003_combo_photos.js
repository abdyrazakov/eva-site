/// <reference path="../pb_data/types.d.ts" />
// Настоящие фото коврика для конкретного сочетания «цвет коврика + цвет канта».
// Если для выбранной пары есть фото, сайт показывает его вместо цифровой перекраски.
migrate(
  (app) => {
    const colors = app.findCollectionByNameOrId('colors');

    app.save(
      new Collection({
        type: 'base',
        name: 'combo_photos',
        listRule: '',
        viewRule: '',
        fields: [
          {
            type: 'relation',
            name: 'mat',
            required: true,
            collectionId: colors.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            type: 'relation',
            name: 'trim',
            required: true,
            collectionId: colors.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            type: 'file',
            name: 'image',
            required: true,
            maxSelect: 1,
            maxSize: 10 * 1024 * 1024,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            thumbs: ['1200x0'],
          },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_combo_photos_pair ON combo_photos (mat, trim)'],
      }),
    );
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('combo_photos'));
  },
);
