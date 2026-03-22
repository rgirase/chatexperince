const http = require('http');
const promptId = 'd2f66f59-5881-4a2e-88c5-ad2b8afbb188';
const url = `http://127.0.0.1:8000/history/${promptId}`;

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const history = JSON.parse(data);
        const item = history[promptId];
        console.log("STATUS:", JSON.stringify(item.status, null, 2));
        if (item.status && item.status.execution_error) {
            const err = item.status.execution_error;
            console.log("NODE ID:", err.node_id);
            console.log("NODE TYPE:", err.node_type);
            console.log("EXCEPTION TYPE:", err.exception_type);
            console.log("EXCEPTION MESSAGE:", err.exception_message);
        } else {
            console.log("No specific execution_error found in status.");
        }
    });
});
