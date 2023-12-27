const webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const path = require('path');
const argvs = require('yargs').argv;
const devMode = process.env.WEBPACK_SERVE || argvs.mode === 'development';

const fs = require('fs')
const packageJson = fs.readFileSync('./package.json')
const version = JSON.parse(packageJson).version || '0.0.0'

const customerInfoRaw = require('./src/customer_info.js')
const processEnv = Object.keys(customerInfoRaw).reduce((result, key) => {
  result[`process.env.${key}`] = JSON.stringify(customerInfoRaw[key])
  return result
}, {})

processEnv['process.env.VERSION'] = `"${version}"`
processEnv['process.env.devMode'] = devMode ? `"development"` : `"production"`
/** !!! vuelidate needs below, otherwise you get "process is not defined" error... */
processEnv['process.env.BUILD'] = `"web"`

console.log(JSON.stringify(processEnv, null, 2));

let webpackConfig = {
  mode: devMode ? 'development' : 'production',

  entry: {
    app: ['./src/app.js']
  },
  output: {
    path: devMode ? path.resolve(__dirname, 'dist') : path.resolve(__dirname, 'dist.prod'),
    filename: '[name].bundle.js',
  },

  optimization: {
    removeAvailableModules: true,
    splitChunks: {
      chunks: 'all'
    },
    runtimeChunk: true,
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,
    providedExports: true,
  },

  resolve: {
    extensions: ['.js', '.vue', '.json', '.css', '.html', '.styl'],
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': path.resolve(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        include: [
          path.resolve(__dirname, 'src'),
        ],
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage',
                  corejs: 3
                }
              ]
            ],
            plugins: ['@babel/plugin-transform-runtime'],
          }
        }]
      },
      {
        test: /\.vue$/,
        include: [
          path.resolve(__dirname, 'src'),
        ],
        use: 'vue-loader'
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: { minimize: true }
          }
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)(\?\S*)?$/,
        include: path.resolve(__dirname, 'src'),
        type: 'asset/resource',
      },
      {
        test: /\.css$/,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { importLoaders: 1 }
          },
          {
            loader: 'postcss-loader',
            options: { sourceMap: true }
          }
        ]
      },
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  },

  // See below for dev plugin management.
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].css'
    }),
    new ProgressBarPlugin(),
    new webpack.DefinePlugin(processEnv),
    // new BundleAnalyzerPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          noErrorOnMissing: true,
          from: path.join(__dirname, '..', 'src/assets'),
          to: path.join(__dirname, '..', 'dist/assets'),
        },
      ],
    })
  ],
  resolveLoader: {
    modules: [ 'node_modules' ]
  },
  performance: {
    hints: false
  }
};


// Development mode
if(devMode) {

  webpackConfig.devtool = 'eval';

  webpackConfig.devServer = {
    static: 'dist',
    open: false,
    port: 8081,
    host: 'localhost',
    devMiddleware: {
      writeToDisk: true,
    }
  }

  let devPlugins = [
    new HtmlWebPackPlugin({
      template: 'index.html',
      chunksSortMode: 'auto'
    })
  ];

  webpackConfig.plugins = webpackConfig.plugins.concat(devPlugins);

} else {

  // Production mode
  let prodPlugins = [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: '../report.html'
    }),
    new HtmlWebPackPlugin({
      template: 'index.html',
      chunksSortMode: 'auto',
      minify: {
        caseSensitive: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeAttributeQuotes: true,
        removeComments: true
      }
    })
  ];
  webpackConfig.plugins = webpackConfig.plugins.concat( prodPlugins );

}

module.exports = webpackConfig;
