import path from "path";

const MAX_MONTHS: number = 1000;
const EPOCH_START = 1970;
const MAX_YEAR = 100000000;
const robo_folder = "./robodata/";

const {readFile, writeFile} = require('fs');
const fs = require('fs');

class Data {
    prodn: number[] = [];
    constructor (public year: string) {};
}

interface IAnalyzer {

}

interface completeOpern {
    (success: boolean, projStarts: number []): void;
}

class Analyzer implements IAnalyzer {

    //The kvpairsMap uses the year as key and holds
    //the production data for the year. This is used to
    //sort the list so that we get a linear list of production
    //based on the index which can be the month count starting from epoch (1970)
    kvPairsMap = new Map<number, Data>();

    //This map holds the month index starting from epoch 1970. So value 0 = Jan 1970
    //It progresses and the map holds the value of that index (ascending order)
    //and the production number for that particular month.
    //A gap in the value of index indicate 0 production on that month
    indexProdnMap = new Map<number, number>();
    //This map holds the map of Active robots accounting the decay factor on every month
    indexActiveRn = new Map<number, number>();

    constructor (){};

    //indexProdnMap hold the map <monthidx, Rn>. This map is to be used for
    //computing the active robots at the factory. This is computed based on the
    //decay idx provided as the input. E0 = 0 and En=1, in between there can be
    //n values which indicate the number of active robots at the end of that index
    //Logic
    //For a specific range or E1 to En we will have n values for each month index
    //[monthIdx] [Rnx(1-E0), Rnx(1-E1), Rnx(1-E2).....Rnx(1-En)]
    //This means the number of active robots in a specific month will be
    //The Rn for that month + RnEn
    //Base on this logic we create a new array which will be the total active
    //Robots available for that month. Also the number of months will be increased
    //based on the range of E0 - En
    computeActiveRobos(numProjects: number, duration: number, decayArray: number[]) : number[] {
        let maxKey = 0;
        for (let key of this.indexProdnMap.keys()){
            //compute the active robots in each subsequent months
            let val  = this.indexProdnMap.get(key);
            let i = 0;
            let preVal = 0;
            decayArray.forEach(element => {
                if (maxKey > key+i){
                    let pv = this.indexActiveRn.get(key+i);
                    if (pv != undefined){
                        preVal = pv;
                    }
                }
                if (val != undefined){
                    this.indexActiveRn.set(key+i, preVal + val*(1-element));
                    preVal = 0;
                    maxKey = key+i;
                    i++;
                }
            });
        }
        console.log(this.indexActiveRn);

        let activeArray: number [] = [10,20,30,50];
        return (activeArray);
    };

    //Dump as a file to a common folder. We are using this
    //async to avoid blocking operations
    saveData(data: string, year: number){
        if (!fs.existsSync(robo_folder)){
            fs.mkdirSync(robo_folder);
        }
        if (year>=EPOCH_START && year<=MAX_YEAR){
            let fileName : string = robo_folder+"robo_"+year+".dat";
            writeFile(fileName, data, 'utf8', (err : Error)=>{
                if (err){
                    console.log(`Error in writing ${fileName}`);
                    return;
                }
                console.log(`Written ${fileName}`);
            });
            console.log(data);
        }
    };

    //Read all the files from the repo folder
    //The file names hold the year associated with the data
    //read all of them and populate our data array
    //First line of the file is the year, remaining are Rn values
    //in the order starting from jan
    populateData(numProjs: number, duration: number, decayIdx: number[], callback: completeOpern) {
        const files = fs.readdir(robo_folder, (err: Error, files: string) => {
            if (err){
                console.log("Folder read error");
                callback(false, []);
                return;
            }
            var fcount = 0;
            for (fcount=0; fcount<files.length; fcount++){
                let year = EPOCH_START;
                let isValid: boolean = false;
                let roboData: Data;
                //This is an async operation hence the response should be send only
                //after finishing the operation
                readFile(robo_folder+files[fcount],'utf8', (err: Error, data: string)=>{
                    if (err){
                        console.log("Error reading file!");
                        return;
                    }
                    let ln = 0;
                    data.split(/\r?\n/).forEach(line =>  {
                        if (ln==0){
                            year = +line;
                            ln++;
                            isValid = true;
                            roboData = new Data(year.toString());
                        }
                        else{
                            if (isValid){
                                roboData.prodn.push(+line);
                            }
                        }
                    });
                    if (roboData.prodn.length){
                        console.log(`Pushing data for ${year}`);
                        this.kvPairsMap.set(year,roboData);
                        //we will use the yearprodnmap to analyze the data
                        if (fcount === this.kvPairsMap.size){
                            console.log("Completed read operations");
                            this.printProdnMap()
                            //compute projN and return
                            var projN = this.computeActiveRobos(numProjs, duration, decayIdx);
                            callback(true, projN);
                        }
                    };
                });
            };
        });
    };

    //delete all the data files from the repo folder
    //and inform the caller
    deleteData() {
        if (fs.existsSync(robo_folder)){
            fs.rm(robo_folder, { recursive: true }, () => {
                console.log('done removing the folder')});
        }
    };

    //helper method to test the production map based on the month index
    printProdnMap() {
        //sort the map
        var mapAsc = new Map([...this.kvPairsMap.entries()].sort());
        var keys: number [] = [];
        var prodnNum: Data [] = [];
        mapAsc.forEach((value: Data, key: number, map)=>{
            let monthIndex = this.getMonthIndex(key);
            value.prodn.forEach((rn)=>{
                this.indexProdnMap.set(monthIndex++, rn);
            });
            keys.push(monthIndex);
        });
        console.log(this.indexProdnMap);
    }

    getMonthIndex(year: number){
        return (year - EPOCH_START) * 12;
    }
}

export {Analyzer};