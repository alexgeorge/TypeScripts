"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const robotech_analyzer_1 = require("./robotech_analyzer");
let bodyParser = require('body-parser');
let analyzer = new robotech_analyzer_1.Analyzer();
const app = (0, express_1.default)();
const buffers = [];
app.use(bodyParser.raw({ type: 'text/plain' }));
app.get("/", (req, res) => {
    return res.status(200).send("Successfully loaded!");
});
app.post('/data', bodyParser.raw({ type: 'text/plain' }), (req, res, next) => {
    const buffer = req.body.toString();
    const data = buffer.split(/\r\n|\r|\n/);
    let year = +data[0];
    console.log(`Data input for the year ${year}:-`);
    analyzer.saveData(buffer, year);
    return res.sendStatus(200).end();
});
app.all('/all', (req, res) => {
    console.log(req.body, res);
    return res.sendStatus(200).end();
});
app.post('/analyze', (req, res) => {
    const buffer = req.body;
    const lines = req.body.toString().split(/\r\n|\r|\n/);
    analyzer.populateData((success) => {
        if (success) {
            console.log("Populated the data successfully");
            return res.sendStatus(200);
        }
        else {
            console.log("Failed to populate");
            return res.sendStatus(300);
        }
    });
    console.log(`Analysis to be done for ${lines[0]} projects, each ${lines[1]} months duration:-\n` + lines);
});
app.delete('/data', (req, res) => {
    console.log(`Request for deleting the data!`);
    return res.sendStatus(200);
});
const PORT = 2468;
app.listen(PORT, () => {
    console.log(`server is running on PORT ${PORT}`);
});
//# sourceMappingURL=index.js.map