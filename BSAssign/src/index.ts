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
  const lines =req.body.toString().split(/\r\n|\r|\n/);
  analyzer.populateData((success: boolean)=>{
    if (success){
      console.log("Populated the data successfully");
      return res.sendStatus(200);
    }else{
      console.log("Failed to populate")
      return res.sendStatus(300);
    }

  });
  console.log(`Analysis to be done for ${lines[0]} projects, each ${lines[1]} months duration:-\n` + lines);
});

app.delete('/data', (req: Request, res: Response)=>{
  console.log(`Request for deleting the data!`);
  return res.sendStatus(200);
});

const PORT = 2468;
app.listen(PORT, () => {
  console.log(`server is running on PORT ${PORT}`)
})