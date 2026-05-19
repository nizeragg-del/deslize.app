const http = require('http');

http.get('http://localhost:3000/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const match = data.match(/href="(\/_next\/static\/css\/[^"]+)"/);
    if (match) {
      console.log('CSS path:', match[1]);
      http.get('http://localhost:3000' + match[1], (cssRes) => {
        let cssData = '';
        cssRes.on('data', (chunk) => { cssData += chunk; });
        cssRes.on('end', () => {
          console.log('CSS contains .hero-glow:', cssData.includes('.hero-glow'));
          console.log('CSS length:', cssData.length);
        });
      });
    } else {
      console.log('No CSS found');
    }
  });
});
