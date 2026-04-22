function formatData(data) {
  if (typeof data === 'string') {
    return data.trim();
  }
  return JSON.stringify(data, null, 2);
}

function validateInput(input) {
  return input && input.length > 0;
}

module.exports = {
  formatData,
  validateInput
};
