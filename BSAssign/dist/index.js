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
    let lines = buffer.toString().split(/\r\n|\r|\n/);
    var numProjs = +lines[0];
    var duration = +lines[1];
    var decayIndex = [];
    for (let i = 2; i < lines.length; ++i) {
        decayIndex.push(lines[i]);
    }
    analyzer.populateData(numProjs, duration, decayIndex, (success, Pn) => {
        if (success) {
            console.log(`Computed the project starts ${Pn}`);
            const outStr = Pn.toString().replace(/,/g, "\n");
            return res.status(200).send(outStr);
        }
        else {
            console.log("Failed to populate");
            return res.status(400).send("Error in data read!");
        }
    });
});
app.delete('/data', (req, res) => {
    console.log(`Request for deleting the data!`);
    analyzer.deleteData();
    return res.sendStatus(200);
});
const PORT = 2468;
app.listen(PORT, () => {
    console.log(`server is running on PORT ${PORT}`);
});
//# sourceMappingURL=index.js.map