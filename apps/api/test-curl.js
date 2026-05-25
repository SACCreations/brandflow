const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    sub: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    businessId: '00000000-0000-0000-0001-000000000001',
    role: 'owner',
    type: 'access',
  },
  'change-me-to-a-long-random-secret-at-least-64-chars',
  { expiresIn: '15m' }
);

fetch('http://localhost:4000/api/v1/brands/analyse', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    sources: [{ type: 'url', value: 'https://example.com' }]
  })
}).then(async res => {
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}).catch(console.error);
