/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    /** @type {import('@types/postcss-import').AtImportOptions} */
    'postcss-import': {},
    'postcss-url': {},
    'postcss-cssnext': {
      features: {
        customProperties: {
            warnings: false
        }
      }
    },
    'cssnano': {
      preset: ['default', {svgo: false}]
    },
    'postcss-remove-declaration': {
      remove: {
        ".text-primary": "color",
        ".text-secondary": "color",
        ".text-success": "color",
        ".text-info": "color",
        ".text-warning": "color",
        ".text-danger": "color",
      }
    },
  }
}