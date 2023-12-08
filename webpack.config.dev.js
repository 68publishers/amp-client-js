const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        standard: {
            import: './index.mjs',
            filename: 'amp-client.js',
            library: {
                type: 'var',
                name: 'AMPClientFactory',
                export: 'AMPClientFactory',
            }
        },
        embed: {
            import: './index.mjs',
            filename: 'amp-client.embed.js',
            library: {
                type: 'var',
                name: 'AMPClientFactory',
                export: 'EmbedAMPClientFactory',
            }
        }
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
                        '@babel/preset-env',
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
