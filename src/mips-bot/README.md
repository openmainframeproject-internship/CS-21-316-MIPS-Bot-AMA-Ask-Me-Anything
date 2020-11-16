# Mips-Bot

In progress. 
Currently is capable of very simple conversation, logging user conversation to database, and obtaining zOS glossary definitions from database.


*A few working sample conversation input examples:*
- "hello", "hi"
- "I need help", "help", "confused", "i am confused", "need assistance" "can you help me"
- "What does <zOS term> mean", "<zOS term>"  **note:** ~~currently zOS terms must be spelled and punctuated correctly to work successfully~~ **updated to allow spelling errors and fuzzy matching


*Getting Started*
- clone repo
- edit .env file to use your own credentials or uncomment Amelia's which are currently left available while this verison remains private
- npm install
- npm start


| File | Description |
|---|---|
| [server.js](https://github.com/openmainframeproject-internship/CS-21-316-MIPS-Bot-AMA-Ask-Me-Anything/tree/master/src/mips-bot/server.js) | connects to watson, mongodb, and works to talk to the api from client interactions to produce conversation and store chat logs to the data base |
| [public](https://github.com/openmainframeproject-internship/CS-21-316-MIPS-Bot-AMA-Ask-Me-Anything/tree/master/src/mips-bot/public) | User Interface, obtained from various Watson Assistant demos with little change, temporary UI to create an ease of understanding and analyzing what the assistant is understanding as we train it further. |
| [training](https://github.com/openmainframeproject-internship/CS-21-316-MIPS-Bot-AMA-Ask-Me-Anything/tree/master/src/mips-bot/training) | This folder contains the json file of the skill that the assistant uses to recognize intents, entities, context variables and essentially perform an 'intelligent' conversation. The current version is extremely limited in the extent of its conversation- will be updated.  |
| [config](https://github.com/openmainframeproject-internship/CS-21-316-MIPS-Bot-AMA-Ask-Me-Anything/tree/master/src/mips-bot/config) | This folder contains a javascript file that connects our app to the database utilizing mongoose|
| [model](https://github.com/openmainframeproject-internship/CS-21-316-MIPS-Bot-AMA-Ask-Me-Anything/tree/master/src/mips-bot/model) | This folder contains a javascript file that specifies the schema of the chat log we collect and exports it as a model to be used to build logs continuously |
| [.env](https://github.com/openmainframeproject-internship/CS-21-316-MIPS-Bot-AMA-Ask-Me-Anything/tree/master/src/mips-bot/.env) | The .env file contains the credents necessary to connect with watson assistant and the mongodb database. Currently, Amelia's credentials are still available in comments while this project is still private and utilized only within the team. |

