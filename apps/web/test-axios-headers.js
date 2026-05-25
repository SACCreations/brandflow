const { AxiosHeaders } = require('axios');
const headers = new AxiosHeaders();
headers.set('Authorization', 'Bearer old');
console.log("Before:", headers.Authorization);

// What happens if we do this?
headers.Authorization = 'Bearer new';
console.log("After:", headers.Authorization);
console.log("JSON:", headers.toJSON());
