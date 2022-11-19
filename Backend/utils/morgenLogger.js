const morgan = require("morgan");

function log(app)
{
    app.use(morgan("dev"))
}

module.exports = log;