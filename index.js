const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const cors = require('cors')
const bodyParser = require('body-parser');

class RestError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
    }
}

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

const users = [];

bot.on('polling_error', (error) => {
    console.log(error);  // => 'EFATAL'
});

bot.on("message", (message) => {
    if (!users.includes(message.from.id)) {
        users.push(message.from.id)
    }
    console.log(users);
});


const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post("/orders", (req, res, next) => {
    if (req.body && req.body.apiKey !== 'secretKey') {
        throw new RestError("Access forbidden, wrong apiKey", 403);
    }
    users.map((user) => {
        return bot.sendMessage(user, req.body.message, {
            parse_mode: "MarkdownV2"
        })
    })
    res.json({
        success: true
    })
})

app.use(function (req, res, next) {
    next(new RestError('Not Found', 404));
});

// error handler
app.use(function (err, req, res, next) {
    console.error(err.message, err.stack);
    // set locals, only providing error in development
    if (err.name.includes("Validation")) {
        err.status = 400;
    }
    if (err.message.toLowerCase().includes("field value too long")) {
        err.status = 400;
        return res.json({
            error: "Maximum file size is 10MB"
        })
    }
    if (!err.status) {
        console.log(err);
    }
    res.status(err.status || 500);
    res.json({
        error: err.message
    })
});

const port = process.env.PORT || 9600;

app.listen(port, () => {
    console.log(`Running on port ${port}`)
});