const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        clientFactory: {
            import: './index.mjs',
            filename: 'amp-client.js',
            library: {
                type: 'var',
                name: 'AMPClientFactory',
                export: 'default',
            }
        },
    },
    output: {
        path: path.resolve(__dirname, 'demo'),
    },
    module: {
        rules: [
            {
                loader:  'babel-loader',
                test: /\.mjs$/,
                include: [
                    path.resolve(__dirname, 'src'),
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
    devServer: {
        static: {
            directory: path.join(__dirname, 'demo'),
        },
        compress: true,
        port: 3000,
    },
};
