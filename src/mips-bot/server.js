'use strict';

require('dotenv').config();
require('colors');

var express = require('express');
var bodyParser = require('body-parser');
// eslint-disable-next-line no-unused-vars
var mongoose = require('mongoose');
const connectDB = require('./config/db.js');
var logger = require('./model/Log.js');
var feedback = require('./model/feedback.js');
var crowd_suggestion = require('./model/crowd-suggest.js');
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

var checkEntity = '';
var checkValue = '';
var checkOut = '';
var checkIntent = '';
var feedbackIntent = '';
var responseGiven = ''
var helpful = '';
var suggestGiven = '';
var suggestion_context = '';
var hold_input = '';
var temp_potential_suggest = '';


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

        // check that dialog section to receive user suggestions is being hit and they confirmed submitting suggestion
        // log session id, input prior to saying bot was not helpful(for immediate context), and user suggestion to db

        if (helpful.length > 0 && suggestGiven === 'yes' && payload.input.text){
            // console.log('input', payload.input.text);
            // console.log('helpful: ', helpful);
            // console.log('suggest given: ', suggestGiven);
            // console.log('suggestion context: '.cyan, suggestion_context);
            var log_suggest = new crowd_suggestion({
                session_id: payload.sessionId,
                suggestion_context: suggestion_context,
                suggestion: payload.input.text
            });
            log_suggest.save(function (err){ if(err) console.log(err);

                helpful = '';
                suggestGiven = '';
                suggestion_context = '';
                return 'suggestion logged successfully.';
            });
        }

        if (helpful.length > 0 && suggestGiven === 'no'){
            // console.log('input', payload.input.text);
            // console.log('helpful: ', helpful);
            // console.log('suggest given: ', suggestGiven);
            // console.log('suggestion context: '.cyan, suggestion_context);
            var log_suggest = new crowd_suggestion({
                session_id: payload.sessionId,
                suggestion_context: suggestion_context,
                suggestion: "no known response, no suggestion given"
            });
            log_suggest.save(function (err){ if(err) console.log(err);

                helpful = '';
                suggestGiven = '';
                suggestion_context = '';
                return 'suggestion logged successfully.';
            });
        }

        if (err) {
            return res.status(500).json({ err,  msg: 'error at assistant.message' });
        }

        //verification to avoid throwing errors/warnings and validate input to database
        if (data.result.output.entities === undefined || data.result.output.entities.length === 0) {
            checkEntity = '';
            checkValue = '';
        }
        else{
            checkEntity = data.result.output.entities[0].entity;
            checkValue = data.result.output.entities[0].value;
        }
        if (data.result.output.generic[0].response_type === 'text'){
            checkOut = data.result.output.generic[0].text;
        }
        else{
            checkOut = data.result.output.generic[1].text;
        }

        // check that feedback intent has been initialized and that user confirmed submitting
        // feedback, log session id, positive/negative, and user fb to db
        if (feedbackIntent.length > 0 && responseGiven === 'yes' && payload.input.text){
            var log_feedback = new feedback({
                session_id: payload.sessionId,
                feedback_type: feedbackIntent,
                feedback: payload.input.text
            });
            log_feedback.save(function (err){ if(err) console.log(err);
                feedbackIntent = '';
                responseGiven = '';
                return 'feedback logged successfully.';
            });

        }

        //check that there is an intent, if none, log empty string
        if (data.result.output.intents === undefined || data.result.output.intents.length === 0) {
            checkIntent = '';

            if (feedbackIntent.length === 0 && helpful.length === 0 && checkIntent === ''){
                temp_potential_suggest = 'unfamiliar input';
                suggestion_context = hold_input
            }
        }
        else{
            checkIntent = data.result.output.intents[0].intent;
            // check if intent indicates positive or negative feedback
            // make less than four to check against self, make value skip to
            // ensure we can differentiate between feedback and suggestions
            if (feedbackIntent.length > 0) {
                if (checkIntent === 'yes') {
                    responseGiven = 'yes';
                }
                else {
                    feedbackIntent = '';
                }
            }
            // save feedback intent to use as indication for logging feedback in separate db
            if (checkIntent === 'General_Negative_Feedback' || checkIntent === 'General_Positive_Feedback') {
                feedbackIntent = checkIntent;
            }

            if (temp_potential_suggest.length > 0){
                if (checkIntent === 'yes'){
                    helpful = temp_potential_suggest;
                    suggestGiven = 'yes';
                }
                if (checkIntent === 'no'){
                    helpful = temp_potential_suggest;
                    suggestGiven = 'no';
                }
                else{
                    temp_potential_suggest = '';
                    suggestion_context = '';
                }
            }
            // check if intent
            if (helpful.length > 0){
                if (checkIntent === 'yes'){
                    suggestGiven = 'yes';
                }
                if (checkIntent === 'no'){
                    suggestGiven = 'no';
                }
                else{
                    helpful = '';
                    suggestion_context = '';
                }
            }

            //if bot is not helpful, hold intent 'no' and previous user input to provide
            // context to what bot got wrong
            if (feedbackIntent.length === 0 && helpful.length === 0 && checkIntent === 'no') {
                helpful = checkIntent;
                suggestion_context = hold_input;
            }

            // clear feedback intent if 'skip' was assigned so logging suggestions
            // is only skipped on the round it is intended to
            if (feedbackIntent.length === 4){
                feedbackIntent = '';
            }

            hold_input = payload.input.text;
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
            chatLog.save(function (err){ if(err) console.log(err); return 'Chat Logging Success.';});
        }
        // console.log(payload.input.text, 'CURRENT INPUT'.blue.bold);
        // console.log('helpful: ', helpful);
        // console.log('suggest given: ', suggestGiven);
        // console.log('suggestion context: ', suggestion_context);
        // console.log('temp potential suggestion', temp_potential_suggest);
        //console.log('after normal logging feedback intent ', feedbackIntent);
        //console.log(responseGiven);

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
    console.log(`Chat-bot running on http://localhost:${PORT}`.rainbow.underline.bold);
});

