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
    (success: boolean): void;
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
    
    constructor (){};

    computeActiveRobos(data: number[], numProjects: number, duration: number, decayArray: number[]) : number[] {
        let activeArray: number [] = [10,20,30,50];
        return (activeArray);
    };

    saveData(data: string, year: number){
        //Dump as a file to a common folder. We are using this
        //async to avoid blocking operations
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

    populateData(callback: completeOpern) {
        //Read all the files from the repo folder
        //The file names hold the year associated with the data
        //read all of them and populate our data array
        //First line of the file is the year, remaining are Rn values
        //in the order starting from jan
        const files = fs.readdir(robo_folder, (err: Error, files: string) => {
            if (err){
                console.log("Folder read error");
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
                            callback(true);
                        }
                    };
                });           
            };             
        });
    };                

    deleteData() {
        //delete all the json data files from the repo folder
        //and inform the caller
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