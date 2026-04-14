const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const fs = require('fs');

const parser = new Parser();
parser.setLanguage(JavaScript);

// Test 1: Simple string
console.log('Test 1: Simple string');
try {
  const tree1 = parser.parse('const x = 1;');
  console.log('✓ Success');
} catch (e) {
  console.log('✗ Error:', e.message);
}

// Test 2: Large file (lodash.js)
console.log('\nTest 2: Lodash.js file');
try {
  const content = fs.readFileSync('/Users/mohamedmohamed/Desktop/projects/lodash/lodash.js', 'utf-8');
  console.log('File size:', content.length, 'characters');
  const tree2 = parser.parse(content);
  console.log('✓ Success');
} catch (e) {
  console.log('✗ Error:', e.message);
}

// Test 3: Using callback (proper API)
console.log('\nTest 3: Using callback function');
try {
  const content = fs.readFileSync('/Users/mohamedmohamed/Desktop/projects/lodash/lodash.js', 'utf-8');
  const tree3 = parser.parse((index, position) => {
    if (index < content.length) {
      return content.slice(index, index + 1);
    }
    return null;
  });
  console.log('✓ Success');
} catch (e) {
  console.log('✗ Error:', e.message);
}
