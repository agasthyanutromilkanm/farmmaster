const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: '6a118f4e2b050dae0af64f86', role: 'SUPER_ADMIN', email: 'admin@admin.com' },
  'dev_secret_key_12345',
  { expiresIn: '1h' }
);

fetch('http://localhost:3000/api/departments', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(err => console.error(err));
