const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const config = {
    mode: "production",
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
        extensions: [".js", ".json", ".jsx", ".css"],
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin()
        ],
    },
};

const defaultConfig = Object.assign({}, config, {
    name: 'default',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'amp-client.min.js',
        library: 'AMPClientFactory'
    }
});

const standaloneConfig = Object.assign({}, config,{
    name: 'standalone',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'amp-client.standalone.min.js',
        library: 'AMPClientFactory'
    },
    externals: {
        'lodash': '_'
    }
});

module.exports = [
    defaultConfig,
    standaloneConfig
];
