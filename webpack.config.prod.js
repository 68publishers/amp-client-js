const path = require('path');
const TerserWebpackPlugin = require('terser-webpack-plugin');

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
            export: 'AMPClientFactory',
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
            export: 'AMPClientFactory',
        },
    },
    externals: {
        'lodash/template.js': '_.template',
        'lodash/merge.js': '_.merge',
    }
});

const embedConfig = Object.assign({}, config, {
    name: 'embed',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'amp-client.embed.min.js',
        library: {
            type: 'var',
            name: 'AMPClientFactory',
            export: 'EmbedAMPClientFactory',
        },
    }
});

module.exports = [
    defaultConfig,
    standaloneConfig,
    embedConfig,
];
