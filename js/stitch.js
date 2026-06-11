const fs = require('fs');
try {
  const content = fs.readFileSync('d:/website/js/public-app-restored.js', 'utf8');
  fs.writeFileSync('d:/website/js/public-app.js', content, 'utf8');
  console.log('Successfully synchronized public-app.js from public-app-restored.js');
} catch (err) {
  console.error('Error during synchronization:', err);
}
