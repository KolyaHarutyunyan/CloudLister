const path = require('path')
const webpack = require('webpack')
const fg = require('fast-glob')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const ExtensionReloader = require('webpack-extension-reloader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const PurgecssPlugin = require('purgecss-webpack-plugin')
const { version, name, description } = require('./package.json')

module.exports = env => {
  const isDevMode = env.NODE_ENV === 'development'
  const portParameter = process.argv.find(
    i => i.startsWith('--p=') || i.startsWith('--port=')
  )
  let port = 5000
  if (portParameter) {
    // eslint-disable-next-line prefer-destructuring
    port = portParameter.split('=')[1]
  }
  const config = {
    devtool: isDevMode ? 'eval-source-map' : false,
    context: path.resolve(__dirname, './src'),
    entry: {
      options: './options/index.js',
      popup: './popup/index.js',
      list: './list/index.js',
      background: './background/index.js',
      'content_scripts/steam-main': './content_scripts/steam-main.js',
      'content_scripts/steam-game-detail':
        './content_scripts/steam-game-detail.js'
    },
    output: {
      path: path.resolve(__dirname, './dist'),
      publicPath: './',
      filename: '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            extractCSS: !isDevMode
          }
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /(node_modules|bower_components)/
        },
        {
          test: /\.scss$/,
          use: [
            isDevMode ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.sass$/,
          use: [
            isDevMode ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader?indentedSyntax'
          ]
        },
        {
          test: /\.styl$/,
          use: [
            isDevMode ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'stylus-loader'
          ]
        },
        {
          test: /\.css$/,
          use: [
            isDevMode ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]?[hash]',
            esModule: false
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|svg)$/,
          loader: 'file-loader',
          options: {
            publicPath: './assets/fonts/',
            outputPath: './assets/fonts/'
          }
        }
      ]
    },
    resolve: {
      alias: {
        vue$: 'vue/dist/vue.runtime.esm.js'
      }
      // extensions: ['.js'],
    },
    plugins: [
      new VueLoaderPlugin(),
      new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'assets', to: 'assets' },
          { from: 'data', to: 'data' },
          {
            from: '_locales',
            to: '_locales',
            transform(content) {
              return JSON.stringify(JSON.parse(content))
            }
          },
          {
            from: 'manifest.json',
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content)
              manifest.version = version
              if (isDevMode) {
                manifest.name = `${name} dev mode`
                manifest.description = `${description} dev mode`
              }
              return JSON.stringify(manifest)
            }
          }
        ]
      }),
      new HtmlWebpackPlugin({
        title: 'Options',
        template: './index.html',
        filename: 'options.html',
        chunks: ['options']
      }),
      new HtmlWebpackPlugin({
        title: 'Popup',
        template: './index.html',
        filename: 'popup.html',
        chunks: ['popup']
      }),
      new HtmlWebpackPlugin({
        title: 'List',
        template: './index.html',
        filename: 'list.html',
        chunks: ['list']
      })
    ]
  }
  if (isDevMode) {
    config.plugins.push(
      new webpack.HotModuleReplacementPlugin(),
      new ExtensionReloader({
        port,
        reloadPage: true,
        entries: {
          contentScript: [
            'content_scripts/steam-main',
            'content_scripts/steam-game-detail'
          ],
          background: 'background',
          extensionPage: 'popup',
          list: 'list',
          options: 'options'
        }
      })
    )
  } else {
    config.plugins.push(
      new ScriptExtHtmlWebpackPlugin({
        async: [/runtime/],
        defaultAttribute: 'defer'
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      new PurgecssPlugin({
        paths: fg.sync([`./src/**/*`], {
          onlyFiles: true,
          absolute: true
        })
      })
    )
  }
  return config
}
