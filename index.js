const express = require('express')
const http = require('http')
const path = require('path')
const morgan = require('morgan')
const { createTerminus } = require('@godaddy/terminus')
const compression = require('compression')
const bodyParser = require('body-parser')
const moment = require('moment')
const rp = require('request-promise-native')
const uuidv4 = require('uuid/v4')
import { GenerateToken } from './jwt_token'

const app = express()
var devEnv = app.get('env') == 'development';

const now = moment().utc();

const client = []
app.use(morgan(devEnv ? 'dev' : 'combined'));
// Include request parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(compression())

// serve up static files
app.use(express.static(path.resolve(__dirname, "dist"))) // eslint-disable-line
app.use(express.static(path.resolve(__dirname, "public"))) // eslint-disable-line

app.get('/atlassian-connect.json', (request, response) => {
  const options = {
    dotfiles: 'deny',
    headers: {
      'Content-Type': 'text/html',
      'x-timestamp': Date.now(),
      'x-sent': true,
    },
  }
  response.sendFile(path.resolve(__dirname, "atlassian-connect.json"), options) // eslint-disable-line
})

app.post('/installed', (request, response) => {
  console.log(request.body)
  const { key, clientKey, publicKey, productType, sharedSecret, serverVersion, pluginsVersion, baseUrl, description, eventType } = request.body
  client.push({
    pid: uuidv4(),
    key,
    clientKey,
    sharedSecret,
    serverVersion,
    pluginsVersion,
    eventType,
    publicKey,
    productType,
    insertedDate: now.unix(),
    updatedDate: now.unix()
  })
  console.log(client)

    response.sendStatus(200)
    response.end()
  
})

app.get('/uninstalled', (request, response) => {
  response.sendStatus(200)
  response.end()
})

app.post('/issue', (req, res) => {

  const { key } = req.body
  let baseurl="https://herculean.atlassian.net"
  let requrl = `/rest/api/3/issue/SA-21?overrideEditableFlag=true&overrideScreenSecurity=true`
  
  var bodyData = `{
    "fields": {
      "trainspottinjas__xy-coordinates": {
        "x": "4",
        "y": "5"
      }
    }
  }`

  let secret = "xxx"

  let token = GenerateToken('PUT', bodyData, requrl, secret)

  let fullurl = baseurl+requrl

  var options = {
    method: 'PUT',
    url: fullurl,
    headers: {
       'Accept': 'application/json',
       'Content-Type': 'application/json',
       'Authorization': `JWT ${token}`
    },
    body: bodyData
 };

 rp.post(options).then(res=>console.log(res)).catch(err => console.log(err))
  
})

app.get('*', (request, response) => {
  const options = {
    dotfiles: 'deny',
    headers: {
      'Content-Type': 'text/html',
      'x-timestamp': Date.now(),
      'x-sent': true,
    },
  }
  response.sendStatus(200)
  response.end()
})


let PORT = process.env.PORT || 8000 //eslint-disable-line

const server = http.createServer(app)

function onHealthCheck() {
  console.log('HealthCheck')
  // checks if the system is healthy, like the db connection is live
  // resolves, if health, rejects if not
}

function onSignal() {
  console.log('server is starting cleanup')// eslint-disable-line
  // start cleanup of resource, like databases or file descriptors
  server.close((err) => {
    if (err) {
      console.error(err)// eslint-disable-line
      process.exit(1)// eslint-disable-line
    }
  })
}

const options = {
  // health check options
  signal: 'SIGINT',
  healthChecks: {
    '/healthcheck': onHealthCheck,
  },
  onSignal,
  // cleanup options
  timeout: 1000                   // [optional = 1000] number of milliseconds before forceful exiting
}

createTerminus(server, options)


server.listen(PORT, () => {
  console.log("App is ready and listening on ", PORT) // eslint-disable-line
})

