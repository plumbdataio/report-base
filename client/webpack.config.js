const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
require('dotenv').config()

const path = require('path');
const argvs = require('yargs').argv;
const devMode = process.env.WEBPACK_SERVE || argvs.mode === 'development';

// These are to get "version" from package.json.
const fs = require('fs')
const packageJson = fs.readFileSync('./package.json')
const version = JSON.parse(packageJson).version || '0.0.0'

let webpackConfig = {
  mode: devMode ? 'development' : 'production',
  externals: {
    gapi: 'gapi'
  },
  entry: {
    // babel: ['babel-polyfill'],  //this should be in the first place
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
          path.resolve(__dirname, 'src')
        ],
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-env"],
            plugins: ["@babel/plugin-proposal-class-properties"],
          }
        }]
      },
      {
        test: /\.vue$/,
        include: path.resolve(__dirname, 'src'),
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
        loader: 'file-loader',
        options: {
          name: "assets/[name].[hash].[ext]",
        }
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
      // {
      //   test: /\.json$/,
      //   loader: 'json'
      // }
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
    new webpack.DefinePlugin({
      'process.env.VERSION': '"' + version + '"',
      'process.env.netlifyMode': devMode ? `"dev"` : '"prod"',
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
  webpackConfig.watch = true;

  webpackConfig.devServer = {
    static: 'dist',
    open: false,
    port: 8082,
    host: 'localhost',
    devMiddleware: {
      writeToDisk: true,
    },
  }

  let devPlugins = [
    new HtmlWebPackPlugin({
      template: 'src/public/index.html.ejs',
      chunksSortMode: 'auto'
    }),
  ];

  webpackConfig.plugins = webpackConfig.plugins.concat( devPlugins　);

} else {
  
  // Production mode
  let prodPlugins = [
    new HtmlWebPackPlugin({
      template: 'src/public/index.html.ejs',
      chunksSortMode: 'auto',
      minify: {
        caseSensitive: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeAttributeQuotes: true,
        removeComments: true
      }
    }),
  ];
  webpackConfig.plugins = webpackConfig.plugins.concat( prodPlugins );

}

module.exports = webpackConfig;
