"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analyzer = void 0;
const MAX_MONTHS = 1000;
const EPOCH_START = 1970;
const MAX_YEAR = 100000000;
const MAX_PROJECTS = 10;
const MAX_DURATION = 10;
const robo_folder = "./robodata/";
const { readFile, writeFile } = require('fs');
const fs = require('fs');
class Data {
    constructor(year) {
        this.year = year;
        this.prodn = [];
    }
    ;
}
class Analyzer {
    constructor() {
        this.kvPairsMap = new Map();
        this.indexProdnMap = new Map();
    }
    ;
    computeActiveRobos(numProjects, duration, decayArray) {
        if (numProjects > MAX_PROJECTS || duration > MAX_DURATION) {
            console.log("ERROR: D or  N Exceeding the limits!");
            return [];
        }
        let maxKey = 0;
        let indexActiveRn = new Map();
        for (let key of this.indexProdnMap.keys()) {
            let val = this.indexProdnMap.get(key);
            let i = 0;
            let preVal = 0;
            decayArray.forEach(element => {
                if (maxKey > key + i) {
                    let pv = indexActiveRn.get(key + i);
                    if (pv != undefined) {
                        preVal = pv;
                    }
                }
                if (val != undefined) {
                    indexActiveRn.set(key + i, preVal + val * (1 - element));
                    preVal = 0;
                    maxKey = key + i;
                    i++;
                }
            });
        }
        console.log(indexActiveRn);
        return (this.scheduleProjects(numProjects, duration, indexActiveRn));
    }
    ;
    scheduleProjects(numProjects, duration, rnMap) {
        let subArraySum = [];
        let projSchedule = [];
        for (let key of rnMap.keys()) {
            let val = rnMap.get(key);
            alert(typeof val);
            console.log(val);
        }
        ;
        return (projSchedule);
    }
    saveData(data, year) {
        if (!fs.existsSync(robo_folder)) {
            fs.mkdirSync(robo_folder);
        }
        if (year >= EPOCH_START && year <= MAX_YEAR) {
            let fileName = robo_folder + "robo_" + year + ".dat";
            writeFile(fileName, data, 'utf8', (err) => {
                if (err) {
                    console.log(`ERROR: Error in writing ${fileName}`);
                    return;
                }
                console.log(`Written ${fileName}`);
            });
            console.log(data);
        }
    }
    ;
    populateData(numProjs, duration, decayIdx, callback) {
        const files = fs.readdir(robo_folder, (err, files) => {
            if (err) {
                console.log("ERROR: Folder read error");
                callback(false, []);
                return;
            }
            var fcount = 0;
            for (fcount = 0; fcount < files.length; fcount++) {
                let year = EPOCH_START;
                let isValid = false;
                let roboData;
                readFile(robo_folder + files[fcount], 'utf8', (err, data) => {
                    if (err) {
                        console.log("ERROR: Error reading file!");
                        return;
                    }
                    let ln = 0;
                    data.split(/\r?\n/).forEach(line => {
                        if (ln == 0) {
                            year = +line;
                            ln++;
                            isValid = true;
                            roboData = new Data(year.toString());
                        }
                        else {
                            if (isValid) {
                                roboData.prodn.push(+line);
                            }
                        }
                    });
                    if (roboData.prodn.length) {
                        console.log(`Pushing data for ${year}`);
                        this.kvPairsMap.set(year, roboData);
                        if (fcount === this.kvPairsMap.size) {
                            console.log("Completed read operations");
                            this.printProdnMap();
                            var projN = this.computeActiveRobos(numProjs, duration, decayIdx);
                            callback(true, projN);
                        }
                    }
                    ;
                });
            }
            ;
        });
    }
    ;
    deleteData() {
        if (fs.existsSync(robo_folder)) {
            fs.rm(robo_folder, { recursive: true }, () => {
                console.log('Done removing the folder!');
            });
        }
    }
    ;
    printProdnMap() {
        var mapAsc = new Map([...this.kvPairsMap.entries()].sort());
        var keys = [];
        var prodnNum = [];
        mapAsc.forEach((value, key, map) => {
            let monthIndex = this.getMonthIndex(key);
            value.prodn.forEach((rn) => {
                this.indexProdnMap.set(monthIndex++, rn);
            });
            keys.push(monthIndex);
        });
        console.log(this.indexProdnMap);
    }
    getMonthIndex(year) {
        return (year - EPOCH_START) * 12;
    }
}
exports.Analyzer = Analyzer;
//# sourceMappingURL=robotech_analyzer.js.map