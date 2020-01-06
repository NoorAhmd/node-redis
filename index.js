const express = require('express')
const request = require('request')
const redis = require('redis')
const fetch = require('node-fetch')

const app = express()


const PORT = process.env.PORT || 5000
const REDIS_PORT = process.env.PORT || 6379

const client = redis.createClient(REDIS_PORT)

function setResponse(username, repos){
    return `<h2>${username} has ${repos} public repos </h2>`
}

function cache(req, res, next){
    const { username } = req.params
    client.get(username, (err, data) => {
        if(err) throw err
        if(data !== null){
            res.send(setResponse(username, data))
        }else{
            next()
        }
    })
}

async function getRepos(req, res, next){
    try {
        console.log('Fetching Data...');
        const { username } = req.params
        const response = await fetch(`https://api.github.com/users/${username}`)
        const data = await response.json()
        const repos = data.public_repos
        client.setex(username, 3600, repos)
        res.send(setResponse(username, repos))
    } catch (error) {
        console.log('Error is :', error);
        res.status(500)
    }
}

app.get('/repos/:username',cache, getRepos)


app.listen(5000, () => {
    console.log(`App listening on port ${PORT}`)
})