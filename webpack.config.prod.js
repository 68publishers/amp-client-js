const path = require('path');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const LodashWebpackPlugin = require('lodash-webpack-plugin');

const config = {
    mode: 'production',
    entry: './index.mjs',
    module: {
        rules: [
            {
                loader:  'babel-loader',
                test: /\.mjs$/,
                include: [
                    path.resolve(__dirname, 'src')
                ],
                options: {
                    presets: [
                        ['@babel/preset-env', {
                            useBuiltIns: 'usage',
                            corejs: {
                                version: '3.40',
                            },
                            targets: "defaults",
                        }],
                    ],
                },
            }
        ],
    },
    resolve: {
        modules: [
            'node_modules',
            path.resolve(__dirname, 'src')
        ],
        extensions: ['.js', '.cjs', '.mjs'],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserWebpackPlugin(),
        ],
    },
    plugins: [
        new LodashWebpackPlugin(),
    ],
};

const defaultConfig = Object.assign({}, config, {
    name: 'default',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'amp-client.min.js',
        library: {
            type: 'var',
            name: 'AMPClientFactory',
            export: 'default',
        },
    }
});

const standaloneConfig = Object.assign({}, config,{
    name: 'standalone',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'amp-client.standalone.min.js',
        library: {
            type: 'var',
            name: 'AMPClientFactory',
            export: 'default',
        },
    },
    externals: {
        'lodash/template.js': '_.template',
        'lodash/merge.js': '_.merge',
    }
});

module.exports = [
    defaultConfig,
    standaloneConfig,
];
