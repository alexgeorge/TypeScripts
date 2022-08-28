import { createImportSpecifier } from "typescript";

const MAX_MONTHS: number = 1000;
const EPOCH_START = 1970;
const MAX_YEAR = 100000000;
const MAX_PROJECTS = 10;
const MAX_DURATION = 10;

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
    firstMonthIndx: number = 0;

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
    //based on the range of E0 - En. 
    computeActiveRobos(numProjects: number, duration: number, decayArray: number[]) : number[] {

        if (numProjects > MAX_PROJECTS || duration > MAX_DURATION){
            console.log("ERROR: D or  N Exceeding the limits!")
            return [];
        }
        let maxKey = 0;
        //This map holds the map of Active robots accounting the decay factor on every month
        let indexActiveRn = new Map<number, number>();        
        for (let key of this.indexProdnMap.keys()){
            //compute the active robots in each subsequent months
            //Note that number is primitve and Number is a wrapper object aroung it
            //It has methods for conversion
            let val  = Number(this.indexProdnMap.get(key));
            let i = 0;
            let preVal = 0;
            decayArray.forEach(element => {
                if (maxKey > key+i){
                    preVal = Number(indexActiveRn.get(key+i));
                }
                indexActiveRn.set(key+i, preVal + val*(1-element));
                preVal = 0;
                maxKey = key+i;
                i++;
            });
        }
        console.log(indexActiveRn);
        return (this.scheduleProjects(numProjects,duration,indexActiveRn));
    };

    //Schedule the projects based on the activeRn map supplied
    //This seems to be a max sub array problem and kadane logic may be applied here
    //Return an array of Pn where Pn is the optimal start time with max robots 
    //for the n projects of D duration 
    scheduleProjects(numProjects: number, duration: number, rnMap: Map<number, number>) : number[] {
        //hold the subarray sum starting from each index
        let subArraySumMap = new Map<number, number>();
        const firstIdx = rnMap.entries().next().value[0];
        const lastIdx = firstIdx + rnMap.size - 1;

        for (let key of rnMap.keys()){
            let subSum = 0;
            for (let i=0; i<duration; ++i){
                if (key+i > lastIdx){
                    break;
                }
                subSum += Number(rnMap.get(key+i));
            }
            subArraySumMap.set(key,subSum);
        };
        //Get the sorted map based on the total robo use per project
        const sortMap = new Map([...subArraySumMap.entries()].sort((a,b) => b[1]-a[1]));
        console.log(sortMap);
        //skipped array indicate that we have some upper level months discarded
        //due to project span constraint. So we have to another round of ComputeMaxRn
        let startKey = sortMap.entries().next().value[0];
        let [maxRnMap, skipped] = this.computeMaxRn(numProjects, duration, sortMap, startKey);
        if (skipped.length){
            let ski: number[] = [];
            let mrn: Map<number, number[]>;
            for (let i=0; i<skipped.length; ++i){
                [mrn, ski] = this.computeMaxRn(numProjects, duration, sortMap, skipped[i]);
                if (mrn.entries().next().value[0] > maxRnMap.entries().next().value[0]){
                    maxRnMap = mrn;
                }
                else if (mrn.entries().next().value[0] === maxRnMap.entries().next().value[0]){
                    //resolve the conflit of same Rn by considering the earliest starting project
                    if (mrn.entries().next().value[1][0] > maxRnMap.entries().next().value[1][0]){
                        maxRnMap = mrn;
                    }
                }
            }
            skipped = ski;
        }
        console.log(maxRnMap);
        let idxArr = this.normaliseEpochMonthIdx(maxRnMap.entries().next().value[1])
        console.log(idxArr);      
        return (idxArr);
    }

    //Find the possible cobinations for n projects 
    //without overlapping. Find their total robo use for n projects.
    //Input:- The sorted map based on the total robo use per project
    //Return an array of skipped indexes and a map with maxRn and idx[]
    computeMaxRn(numProjects: number, duration: number, sortMap: Map<number, number>, startKey: number): 
    [Map<number, number[]>, number[]] {
        let maxSum = 0;
        let projCount = 0;
        let prevKey = startKey;
        //this map hold the maxRn for n projects with an array of their monthIndex 
        let distributionMap = new Map<number, number[]>();
        let rnArr: number [] = [];
        let skipped: number [] = [];
        let started: boolean = false;

        for (let [key, value] of sortMap){
            if (startKey != key && !started){
                continue;
            }
            started = true;            
            projCount++;
            let span = Math.abs(prevKey-key);
            if (span < duration && span != 0){
                skipped.push(key);
                continue;
            }        
            maxSum += value;
            rnArr.push(key);
            prevKey = key;
            if (projCount >= numProjects){
                //sort the entries in ascending order 
                rnArr.sort();
                distributionMap.set(maxSum, rnArr);
                break;
            }
        }
        console.log(distributionMap);
        console.log(skipped);
        return [distributionMap, skipped];        
    }

    //Dump as a file to a common folder. We are using this
    //async to avoid blocking operations
    saveData(data: string, year: number){
        if (!fs.existsSync(robo_folder)){
            fs.mkdirSync(robo_folder);
        }
        fs.readdir(robo_folder, (err: Error, files: any)=>{
            if (files.length > MAX_MONTHS){
                console.log("ERROR: Production number submission exceed the limits!");
                return;
            }
        })
        if (year>=EPOCH_START && year<=MAX_YEAR){
            let fileName : string = robo_folder+"robo_"+year+".dat";
            writeFile(fileName, data, 'utf8', (err : Error)=>{
                if (err){
                    console.log(`ERROR: Error in writing ${fileName}`);
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
                console.log("ERROR: Folder read error");
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
                        console.log("ERROR: Error reading file!");
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
                console.log('Done removing the folder!')});
        }
    };

    //helper method to test the production map based on the month index
    printProdnMap() {
        //sort the map
        var mapAsc = new Map([...this.kvPairsMap.entries()].sort());
        var keys: number [] = [];
        var prodnNum: Data [] = [];
        this.firstMonthIndx = this.getMonthIndex(mapAsc.entries().next().value[0]);
        mapAsc.forEach((value: Data, key: number, map)=>{
            let monthIndex = this.getMonthIndex(key);
            value.prodn.forEach((rn)=>{
                this.indexProdnMap.set(monthIndex++, rn);
            });
            keys.push(monthIndex);
        });
        console.log(this.indexProdnMap);
    }

    getMonthIndex(year: number): number{
        return (year - EPOCH_START) * 12;
    }

    normaliseEpochMonthIdx(monthIdx: number[]): number[]{
        let normlisedIdx: number [] = [];
        let normIdx = 0;
        for (let i=0; i<monthIdx.length; ++i){
            //jan is 0 in our start, compensate it. 
            //Output representing the inex from starting year
            //so the months should be counted from the start year
            //Make it modular if we expect the month only            
            //normIdx = (monthIdx[i]-this.firstMonthIndx+1) % 12;
            normIdx = (monthIdx[i]-this.firstMonthIndx+1);
            normlisedIdx.push(normIdx); 
        }
        return normlisedIdx;
    }
}

export {Analyzer};