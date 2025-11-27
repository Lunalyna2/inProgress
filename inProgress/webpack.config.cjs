const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Entry point of your application
  entry: path.join(__dirname, 'src', 'index.tsx'),
  // Output path and filename for the bundled file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
    module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            // This is the key: Ignore TS errors in production
            transpileOnly: true,
            configFile: 'tsconfig.json',
            // Optional: Use fork-ts-checker-webpack-plugin for parallel checking (install if needed: npm i -D fork-ts-checker-webpack-plugin)
            // But start with this for simplicity
          }
        }
      },
      // ... other rules
    ]
  },
  // File extensions to resolve
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },




  // Rules for how Webpack should process different file types
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
        },
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/, 
        use: [
          'style-loader', 
          'css-loader',   
        ],
      },
    ],
  },
  // Plugins to extend Webpack's functionality
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'public', 'index.html'),
    }),
  ],
  // Configuration for the development server
  devServer: {
    port: 3000,
    open: true, // Automatically open the browser
    historyApiFallback: true,

  },
  mode: 'development', // Set mode to 'production' for a minimized build
};