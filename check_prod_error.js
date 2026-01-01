const http = require('http');

http.get('http://localhost:3000/api/notion/roles', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        try {
            const json = JSON.parse(data);
            console.log('Body:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Body:', data);
        }
    });
}).on('error', (err) => {
    console.log('Error: ' + err.message);
});
