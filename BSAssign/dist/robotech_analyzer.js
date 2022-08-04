"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analyzer = void 0;
const MAX_MONTHS = 1000;
const EPOCH_START = 1970;
const MAX_YEAR = 100000000;
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
class kvPair {
}
;
class Analyzer {
    constructor() {
        this.yearProdnMap = [{}];
    }
    ;
    computeActiveRobos(data, numProjects, duration, decayArray) {
        let activeArray = [10, 20, 30, 50];
        return (activeArray);
    }
    ;
    saveData(data, year) {
        if (!fs.existsSync(robo_folder)) {
            fs.mkdirSync(robo_folder);
        }
        if (year >= EPOCH_START && year <= MAX_YEAR) {
            let fileName = robo_folder + "robo_" + year + ".dat";
            writeFile(fileName, data, 'utf8', (err) => {
                if (err) {
                    console.log(`Error in writing ${fileName}`);
                    return;
                }
                console.log(`Written ${fileName}`);
            });
            console.log(data);
        }
    }
    ;
    populateData(callback) {
        const files = fs.readdir(robo_folder, (err, files) => {
            if (err) {
                console.log("Folder read error");
                return;
            }
            var fcount = 0;
            for (fcount = 0; fcount < files.length; fcount++) {
                let year = EPOCH_START;
                let isValid = false;
                let roboData;
                let filesRead = 0;
                readFile(robo_folder + files[fcount], 'utf8', (err, data) => {
                    if (err) {
                        console.log("Error reading file!");
                        return;
                    }
                    let ln = 0;
                    console.log(`Reading file ${fcount}`);
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
                    filesRead++;
                    let kvp = new kvPair();
                    kvp[year] = roboData;
                    console.log(`Pushing data for ${kvp[year].prodn} files done ${filesRead}`);
                    this.yearProdnMap.push(kvp);
                });
            }
            ;
        });
    }
    ;
    deleteData() {
    }
    ;
    printProdnMap() {
        this.yearProdnMap.sort();
        if (this.yearProdnMap.length) {
            console.log(`List of production count Rn from ${this.yearProdnMap.length}`);
        }
    }
}
exports.Analyzer = Analyzer;
//# sourceMappingURL=robotech_analyzer.js.map