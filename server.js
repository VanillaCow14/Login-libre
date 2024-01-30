const express = require('express');
const bodyParser = require('body-parser');
const { Kafka, logLevel } = require('kafkajs');
const path = require('path');

const app = express();
const port = 3000;

const users = [
  { username: 'admin', password: 'admin' },
  { username: 'aldo', password: '12345' },
  { username: 'alex', password: '12345' }
]
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['192.168.1.64:9092'],
  retry:{
    maxRetryTime: 3000,
    retries: 5,
  },
});

const producer = kafka.producer();

producer.connect();

// Manejar eventos de conexión y desconexión
producer.on('producer.connect', async () => {
  console.log('Producer connected to Kafka');
});

producer.on('producer.disconnect', async (err) => {
  console.error(`Producer disconnected: ${err}`);
  // Puedes intentar reconectar aquí
}); 

app.use(bodyParser.json());

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'proyecto.html'));
  });

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Produce un mensaje en el tópico "login-topic"
    await producer.connect();
    await producer.send({
      topic: 'login-topic',
      messages: [{ value: JSON.stringify(user) }],
    });

    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});