const keys = require('./keys');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// configure Postgres
const {Pool} = require('pg');
const pgClient = new Pool({
    user: keys.pgDatabase,
    host: keys.pgHost,
    port: keys.pgPort,
    database: keys.pgDatabase,
    password: keys.pgPassword
});

pgClient.on('error', () => console.log('Lost PG connection'));

pgClient.query('CREATE TABLE IF NOT EXISTS Values (number INT)')
        .catch(error=>console.log(error));

// configure Redis client
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

app.get('/', (request, response) => {
    response.send('Hi there');
});

app.get('/values/all', async (request, response) =>{
    const values = await pgClient.query('SELECT number FROM Values');

    response.send(values.rows);
});

app.get('/values/current', (request, response) => {
    redisClient.hgetall('values', (err, values) => {
        response.send(values);
    });
});

app.post('/values', async (request, response) => {
    const index = request.body.index;

    if(parseInt(index) > 30){
        // 422 Unprocessable Entity
        return response.status(422).send("Index too high");
    }

    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO Values(number) VALUES($1)', [index]);

    response.send({working : true});
});


app.listen(5000, err => {
    console.log('Listeting on 5000');
});