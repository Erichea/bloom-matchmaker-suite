const fs = require('fs');

console.log('=== Testing JSON Files ===');

try {
  // Read and parse English
  const enContent = fs.readFileSync('./public/locales/en.json', 'utf8');
  const enData = JSON.parse(enContent);

  console.log('English JSON parsed successfully');
  console.log('Root keys:', Object.keys(enData));

  if (enData.dashboard) {
    console.log('Dashboard section found');
    console.log('Dashboard keys:', Object.keys(enData.dashboard));
    console.log('welcomeBack:', enData.dashboard.welcomeBack);
    console.log('there:', enData.dashboard.there);
  } else {
    console.log('❌ Dashboard section NOT found');
  }

  // Read and parse French
  const frContent = fs.readFileSync('./public/locales/fr.json', 'utf8');
  const frData = JSON.parse(frContent);

  console.log('French JSON parsed successfully');
  console.log('Root keys:', Object.keys(frData));

  if (frData.dashboard) {
    console.log('French dashboard section found');
    console.log('French dashboard keys:', Object.keys(frData.dashboard));
    console.log('welcomeBack:', frData.dashboard.welcomeBack);
  } else {
    console.log('❌ French dashboard section NOT found');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}