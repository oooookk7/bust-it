import path from "path";
import webpack from 'webpack';
import htmlWebpackPlugin from 'html-webpack-plugin'
import { Configuration as WebpackConfiguration } from "webpack";
import { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";

const copyPlugin = require('copy-webpack-plugin')
const compressionPlugin = require('compression-webpack-plugin')

const config: webpack.Configuration = {
  mode: "production",
  entry: "./src/index.tsx",
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
          },
        },
      },
      {
        test: /\.(sass|less|css|scss)$/,
        use: ["style-loader", "css-loader", "sass-loader"],
        include: [
          path.join(__dirname, 'src'),
          /node_modules/
        ],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'file-loader'
      }
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".css", ".sass", ".scss", ".png"],
    modules: ['src', 'node_modules'],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },
  plugins: [
    new copyPlugin({
      patterns: [{ from: './src/static', to: './' }]
    }),
    new htmlWebpackPlugin({
      template: path.join(__dirname, './src/static/index.tmpl.html')
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),

    new webpack.DefinePlugin({
      'process.env.SERVER_PORT': JSON.stringify(process.env.SERVER_PORT || '8080'),
      'process.env.CARDS_FOLDER_DIR': JSON.stringify('cards')
    }),
  ]
};

module.exports = (env: any, options: any) => {
  if (options.mode === 'development') {
    interface Configuration extends WebpackConfiguration {
      devServer?: WebpackDevServerConfiguration;
    }

    let extendedConfig: Configuration = config;

    extendedConfig.mode = "development";

    extendedConfig.devServer = {
      compress: false,
      historyApiFallback: true,
      port: 4000,
    };

    return extendedConfig;
  }
  else if (options.mode === 'production') {
    config.plugins.push(new compressionPlugin())
  }

  return config;
};