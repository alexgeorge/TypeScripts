import express, { Request, Response, NextFunction} from "express";
import { Analyzer } from "./robotech_analyzer";

let bodyParser = require('body-parser');
let analyzer = new Analyzer();

const app = express();
const buffers: number [] = [];

app.use(bodyParser.raw({type: 'text/plain'}));

app.get("/", (req: Request, res: Response) => {
  return res.status(200).send("Successfully loaded!");
});  

app.post('/data', bodyParser.raw({type: 'text/plain'}), (req: Request, res: Response, next: NextFunction) =>{
  const buffer = req.body.toString(); 
  const data = buffer.split(/\r\n|\r|\n/);
  let year: number = +data[0]; 
  console.log(`Data input for the year ${year}:-`);
  analyzer.saveData(buffer, year);
  return res.sendStatus(200).end();
});

app.all('/all', (req: Request, res: Response)=>{
  console.log(req.body, res);
  return res.sendStatus(200).end();
});

app.post('/analyze', (req: Request, res: Response) =>{
  const buffer = req.body; 
  let lines = buffer.toString().split(/\r\n|\r|\n/);
  //get the input details for computation
  var numProjs = +lines[0];
  var duration = +lines[1];
  var decayIndex: number [] = []; 
  for (let i=2; i<lines.length; ++i){
    decayIndex.push(lines[i]);
  }
  
  analyzer.populateData(numProjs, duration, decayIndex, (success: boolean, Pn: number [])=>{
    if (success){
      console.log(`Computed the project starts ${Pn}`);
      const outStr = Pn.toString().replace(/,/g,  "\n"); 
      return res.status(200).send(outStr);
    }else{
      console.log("Failed to populate")
      return res.status(400).send("Error in data read!");
    }
  });

});

app.delete('/data', (req: Request, res: Response)=>{
  console.log(`Request for deleting the data!`);
  analyzer.deleteData();
  return res.sendStatus(200);
});

const PORT = 2468;
app.listen(PORT, () => {
  console.log(`server is running on PORT ${PORT}`)
})