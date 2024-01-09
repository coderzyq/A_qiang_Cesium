/*
 * @Description: "vueconfig.js配置文件，配置cesium路径"
 * @Author: coderqiang
 * @Date: 2023-06-06 21:17:52
 * @LastEditTime: 2023-06-07 21:33:30
 * @LastEditors: coderqiang
 */
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const { defineConfig } = require("@vue/cli-service");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const path = require("path");
let cesiumSource = "./node_modules/cesium/Source"
const cesiumWorkers = '../Build/Cesium/Workers';
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  publicPath: '/',
  configureWebpack: {
    output: {
        sourcePrefix: " ",
    },
    amd: {
        //Enanble webpack-friendly use of require in Cesium
        toUrlUndefined: true,
    },
    resolve: {
        alias: {
            "@": path.resolve("src"),

            // "/": path.resolve("public")
            // cesium: path.resolve(__dirname, cesiumSource),
        },
        fallback: { "https": false, "zlib": false, "http": false, "url": false },
      mainFiles: ['index', 'Cesium']
    },
    plugins: [
        //Copy Cesium Assets, Widgets, and Workers to a static dirctory
        new CopyWebpackPlugin({
            patterns: [{
                    from: path.join(cesiumSource, cesiumWorkers),
                    to: "Workers",
                },
                {
                    from: path.join(cesiumSource, "Assets"),
                    to: "Assets",
                },
                {
                    from: path.join(cesiumSource, "Widgets"),
                    to: "Widgets",
                },
                {
                    from: path.join(cesiumSource, "ThirdParty/Workers"),
                    to: "ThirdParty/Workers",
                },
            ],
        }),
        new webpack.DefinePlugin({
            //Define relate base path in cesium for loading assets
            CESIUM_BASE_URL: JSON.stringify("../../"),
        }),
        new NodePolyfillPlugin()
    ],
},
});
