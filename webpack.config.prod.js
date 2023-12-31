const path = require('path');
const TerserWebpackPlugin = require('terser-webpack-plugin');

const config = {
    mode: 'production',
    entry: './index.js',
    module: {
        rules: [
            {
                loader:  'babel-loader',
                test: /\.js$/,
                include: [
                    path.resolve(__dirname, 'src')
                ],
                options: {
                    presets: [
                        '@babel/preset-env'
                    ]
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
};

const defaultConfig = Object.assign({}, config, {
    name: 'default',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'amp-client.min.js',
        library: {
            type: 'var',
            name: 'AMPClientFactory',
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
        },
    },
    externals: {
        'lodash/template': '_.template',
        'lodash/merge': '_.merge',
    }
});

module.exports = [
    defaultConfig,
    standaloneConfig
];
