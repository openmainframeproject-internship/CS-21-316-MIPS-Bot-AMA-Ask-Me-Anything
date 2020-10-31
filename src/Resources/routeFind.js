const mongodb = require("mongodb");
let client = null;


async function getDefByTerm(mongoRL, term) {

    client = await mongodb.MongoClient.connect(mongoRL);
    const qRes = await client.db('botdb').collection('zos').findOne({ Term: term });

    return { defined: qRes.Definition }   
}

function main(params) {
    mongoRL='mongodb://cs21-316:watsonBotsonMango613@dbaas229.hyperp-dbaas.cloud.ibm.com:29466/botdb?authSource=admin&replicaSet=watbot&readPreference=primary&appname=MongoDB%20Compass&ssl=true'
    switch(params.hook) {
        case "findByTerm":
            return getDefByTerm(mongoRL, params.term);
        default:
            return { dberror: "No action defined", hook: params.hook}
    }
}
