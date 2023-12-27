module.exports = ({ webpackLoaderContext }) => {
  // console.log(webpackLoaderContext)
  return {
  parser: false,
  plugins: {
    'postcss-import': {
      // root: webpackLoaderContext?.context
    },
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
}};