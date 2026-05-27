const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:4000/api/v1/content/generate', {
      brandId: 'b3f524fb-27e1-4c12-9c98-1e434f0e21eb', // dummy uuid
      platform: 'linkedin',
      type: 'smo_poster',
      topics: ['test']
    }, {
      headers: {
        'Content-Type': 'application/json'
        // Missing auth token maybe? But it would be 401 Unauthorized, not 400.
      }
    });
    console.log(res.data);
  } catch (err) {
    console.log(err.response?.status);
    console.log(err.response?.data);
  }
}
test();
