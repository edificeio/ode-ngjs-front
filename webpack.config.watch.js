const path = require('path');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

module.exports = env => ({
  mode: "development",
  entry: {
    'ode-ngjs-front': './src/ts/index.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, env.build_target),
    clean: true
  },
  externals: {
    "angular": "angular",
    "jquery": "$",
    "ode-ts-client": 'window.entcore["ode-ts-client"]'
  },
  // @see https://github.com/TypeStrong/ts-loader#devtool--sourcemaps
  devtool: "inline-source-map",
  resolve: {
    // Resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".html"]
  },
  plugins: [
    new MomentLocalesPlugin({
        localesToKeep: ['de', 'es', 'fr', 'it', 'pt'],  // ('en' is built into Moment and can’t be removed)
    }),
  ],
  module: {
    rules: [
      // ts-loader will handle files with `.ts` or `.tsx` extensions
      { test: /\.tsx?$/, loader: "ts-loader" },
      // Images required by widgets are inlined: the platform serves no assets for them.
      { test: /\.png$/, type: "asset/inline" },
      // file-loader will handle files with `.lazy.html` extensions
      { test: /\.lazy\.html$/, loader: 'file-loader', options: {} },
      // html-loader will handle all files with `.html` but not `.lazy.html` extensions
      {
        test: /\.html$/,
        exclude: /\.lazy\.html$/,
        loader: 'html-loader',
        options: {
          minimize: true,
          sources: false, // Disables attributes processing
        },
      },
    ],
  },
});
