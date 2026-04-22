// This file uses CommonJS imports to test different import syntax
const express = require('express');
const localHelper = require('./utils/js-helper');

const app = express();

app.get('/api/users', (req, res) => {
  const data = localHelper.formatData({ users: [] });
  res.json(data);
});

module.exports = app;
