import express from 'express';
import http from "http";
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv-defaults';
import mongoose from 'mongoose';
import Todo from './db.js';

// Connect to mongo db
dotenv.config();
const url = process.env.MONGO_URL;
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("mongo db connection created"));

// init middleware
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server});
// Broadcast function
const broadcastMessage = (data) => { // How to modify wss.on?
    wss.clients.forEach((client) => {
        sendData(data, client);
    })
}

const sendData = (data, ws) => {
  ws.send(JSON.stringify(data));
}

const db = mongoose.connection;
db.once('open',() => {
  wss.on('connection', (ws) => {
      ws.onmessage = async (byteString) => {
          const {data} = byteString;
          const [task, payload] = JSON.parse(data);
          switch(task){
              case "init": {
                  const todos = await Todo.find({});
                  console.log(todos.length,"todos found");
                  broadcastMessage(["init",todos]);
                  break;
              }
              case 'add': {
                  const todos = await Todo.find({});
                  const id = todos.length, text = payload[0], isDone = payload[1];
                  console.log(id,text,isDone);
                  const todo = new Todo({id, text, isDone})
                  // Save to DB
                  try{
                      await todo.save();
                  }
                  catch(e){
                      throw new Error("Todo DB save error: " + e);
                  }
                  broadcastMessage(["add", [id, text, isDone]]);
                  break;
              }
              case 'edit': {
                  broadcastMessage(["edit", payload]);
                  break;
              }
              case 'remove': {
                  const nowID = payload[0], nowPos = payload[1];
                  console.log("Removing todo: ", nowID, Todo.findOne({id: nowID}).text);
                  // Save to DB
                  try{
                      await Todo.findOneAndDelete({id: nowID});
                  }
                  catch(e){
                      throw new Error("Todo DB save error: " + e);
                  }
                  broadcastMessage(["remove", nowPos]);
                  break;
              }
              case 'updateID': {
                const oldID = payload[0], newID = payload[1];
                await Todo.findOneAndUpdate({id: oldID}, {id: newID});
                break;
              }
              case 'updateText': {
                const id = payload[1].id, newText = payload[1].text;
                await Todo.findOneAndUpdate({id: id}, {text: newText});
                break;
              }
              case 'delete':{
                  Todo.deleteMany({},() => {
                      broadcastMessage(['cleared'],{ 
                          type: 'info', 
                          msg: 'Todo cache cleared'
                      });
                  })
                  broadcastMessage(["delete"]);
                  break;
              }
              default: break;
          }
      }
      // sendData(['output',[payload]])
  })
  const PORT = process.env.port || 8080;
  server.listen(PORT, () => {
      console.log(`Listening on http://localhost:${PORT}`);
  });
})