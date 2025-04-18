import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });




wss.on('connection', function connection(ws ,req) {
  const params = req.url
  const url = new URLSearchParams(params?.split('?')[1])
  const token = url.get('token')

  if (!token) {
    ws.close()
    return
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
  if (!decoded) {
    ws.close()
    return
  }



  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});