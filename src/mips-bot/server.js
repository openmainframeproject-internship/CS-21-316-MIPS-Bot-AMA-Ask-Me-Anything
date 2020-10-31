'use strict';

require('dotenv').config();
require('colors');

var express = require('express');
var bodyParser = require('body-parser');
// eslint-disable-next-line no-unused-vars
var mongoose = require('mongoose');
const connectDB = require('./config/db.js');
var logger = require('./model/Log.js');
//var cors = require('cors');
var AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');

var app = express();
app.use(express.static('./public')); // UI stored in public
app.use(bodyParser.json());

//connects to db for logging conversation
// this is our 'patch' to the logs api only being available to watson
// assistant V2 premium
connectDB();

//service wrapper
var authenticator = new IamAuthenticator({
    apikey: process.env.WATSON_API_KEY
});

var assistant = new AssistantV2({
    version: '2020-09-24',
    authenticator: authenticator,
    url: process.env.WATSON_URL
});

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
    var assistantId = process.env.WATSON_ID;
    var textIn = '';

    if (req.body.input) {
        textIn = req.body.input.text;
    }

    var payload = {
        assistantId: assistantId,
        sessionId: req.body.session_id,
        input: {
            message_type: 'text',
            text: textIn,
        },
    };

    assistant.message(payload, function(err, data) {
        if (err) {
            return res.status(500).json({ err,  msg: 'error at assistant.message' });
        }

        //verification to avoid throwing errors/warnings and validate input to database
        var checkEntity = '';
        var checkValue = '';
        if (data.result.output.entities === undefined || data.result.output.entities.length === 0) {
            checkEntity = '';
            checkValue = '';
        }
        else{
            checkEntity = data.result.output.entities[0].entity;
            checkValue = data.result.output.entities[0].value;
        }
        var checkOut = '';
        if (data.result.output.generic[0].response_type === 'text'){
            checkOut = data.result.output.generic[0].text;
        }
        else{
            checkOut = data.result.output.generic[1].text;
        }
        var checkIntent = '';
        if (data.result.output.intents === undefined || data.result.output.intents.length === 0) {
            checkIntent = '';
        }
        else{
            checkIntent = data.result.output.intents[0].intent;
        }
        // build entry for database of chatlog to match schema defined in
        // models/logs.js
        if (payload.input.text) {
            var chatLog = new logger({
                session_id: payload.sessionId,
                input: payload.input.text,
                intent: checkIntent,
                entity: checkEntity,
                value: checkValue,
                output: checkOut
            });
            // eslint-disable-next-line no-console
            chatLog.save(function (err){ if(err) console.log(err); return 'Chat Logging Success.';});
        }

        return res.json(data);
    });

});

app.get('/api/session', function(req, res) {
    assistant.createSession(
        {
            assistantId: process.env.WATSON_ID,
        },
        function(error, response) {
            if (error) {
                return res.status(500).json({ error, msg: 'error at assistant.createSession' });
            } else {
                return res.send(response);
            }
        }
    );
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, function() {
    // eslint-disable-next-line
    console.log(`Chat-bot running on http://localhost:${PORT}`.rainbow.bold);
});

