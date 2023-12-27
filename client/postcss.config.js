module.exports = ({ webpackLoaderContext }) => ({
  parser: false,
  plugins: {
    'postcss-import': { root: webpackLoaderContext.context },
    'postcss-url': {},
    'postcss-cssnext': {},
    'postcss-preset-env': {},
    'cssnano': {}
  }
});