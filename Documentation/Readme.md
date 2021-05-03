# Documentation Folder
| Document | Description |
|---|---|
| ## Statement of Work | Short description of the project, description of Current state, value, business requirements |
| Architecture | High-level design.  Components and where they would exist (e.g. web server, database server, application server, z/OS |
| Detailed Design | Identify modules making up each component.  data flows between modules.  Also ERDs and other documentation depending upon technologies used |
| Installation Guide| How to install and configure the project |
| User Guide | Any user interface instructions |


## Statement of Work
<p>The goal of the MIPS Bot AMA Project is to establish a chatbot that can assist developers and new programmers with learning about the IBM Mainframe. The bot, powered by IBM Watson Assistant, will use a combination of machine learning and crowdsourcing to develop nuanced, and easily readable answers to general system queries, and specific api questions.</p> 



## Architecture
<p>The general approach is MVC. The model is Watson-assistant, which uses machine learning to interpret user dialogue and provide answers. The View will be our landing page, wchich will also supply information about the status of unanswered queries. The Model is a storage instance supplied by IBM, containing a z/OS dictionary. Errors and other information are logged to a MongoDB isntance. </p>

