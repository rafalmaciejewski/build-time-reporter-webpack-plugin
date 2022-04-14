# build-time-reporter-webpack-plugin

[![npm version](https://badge.fury.io/js/build-time-reporter-webpack-plugin.svg)](https://badge.fury.io/js/build-time-reporter-webpack-plugin)  
[![Build Status](https://travis-ci.com/rafalmaciejewski/build-time-reporter-webpack-plugin.svg?branch=master)](https://travis-ci.com/rafalmaciejewski/build-time-reporter-webpack-plugin)   
[![License](http://img.shields.io/:license-mit-blue.svg)](http://badges.mit-license.org)

---  

## Installation

```bash
npm install build-time-reporter-webpack-plugin --save-dev
```

## Usage

**webpack.config.js**

```js
const BuildTimeReporterWebpackPlugin = require('build-time-reporter-webpack-plugin');

module.exports = {  
  plugins: [
    new BuildTimeReporterWebpackPlugin({
      report: (report) => console.log('Here is there report!', report),
    }),
  ],
};
```

## Configuration

```js
new BuildTimeReporterWebpackPlugin(options?: object)
```

|Name|Type|Description|
|:--:|:--:|:----------|
|**`report`**|`(report) => void`|Callback function with report as argument. This should be used|
