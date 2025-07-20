module.exports = async function (context, req) {
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            message: "Hello from Azure Functions!",
            time: new Date().toISOString(),
            method: req.method,
            url: req.url
        }
    };
};