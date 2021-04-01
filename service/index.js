const keys = require('./keys')
const redis = require('redis')

const redisClient = redis.createClient({
    host : keys.redisHost,
    port : keys.redisPort,
    timeout : () => 1000
});

const sub = redisClient.duplicate();

// I do understand that recursion is the most terrible
// way to compute fib values but I'm not chasing the goal of high performance here
// so that it's not super important thing to use a loop and memoization
function computeFibValue(value){
    if(value < 2) return 1;
    return computeFibValue(value - 1) + computeFibValue(value - 2);
}

sub.on('message', (channel, message) => {
    redisClient.hset('message', message, computeFibValue(parseInt(message)));
});

sub.subscribe('insert');