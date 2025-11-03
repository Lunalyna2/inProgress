const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Entry point of your application
  entry: path.join(__dirname, 'src', 'index.js'),
  // Output path and filename for the bundled file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  // Rules for how Webpack should process different file types
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
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
  },
  mode: 'development', // Set mode to 'production' for a minimized build
};