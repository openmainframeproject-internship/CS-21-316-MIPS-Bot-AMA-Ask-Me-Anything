from flask import Flask, render_template, request, jsonify
import json
from ibm_watson import AssistantV2, AssistantV1, ApiException
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
import pymongo

app = Flask(__name__)

iAMvalue = ""
aservice_url = ""
assistant_id = ""   # also workspace id


client = pymongo.MongoClient("")    # online db url
db = client.Watson
collection = db.Definitions

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template("index.html")

# /test/ is the main function and will send and recieve data from watson
# the IBM glossary is treated as confirmed correct answers for this demo
# the glossary is a json file stored elsewhere
# if watson detects definition intent, it will pull from a json file.
# the webhook on ibm watson:

#     def main(dict):
#         r = requests.get(url="https://mscott314.github.io/json/")
#     data = r.json()
#
#     if 'word' in dict:
#         word = dict.get("word")
#     else:
#         word = "I don't understand (webhook)"
#     return { word : data[word] }


@app.route('/test/', methods=['GET', 'POST'])
def test():

    keyword = request.form["question"]


    authenticator = IAMAuthenticator(iAMvalue)
    assistant = AssistantV2(
        version='2020-04-01',
        authenticator=authenticator
    )
    assistant.set_service_url(aservice_url)

    # noinspection PyTypeChecker
    response = assistant.message_stateless(
        assistant_id=assistant_id,
        input={
            'message_type': 'text',
            'text': keyword
        }
    ).get_result()

    answer = json.dumps(response["output"]["generic"][0]["text"]).strip('"')

    try:
        definition = response["output"]["intents"][0]["intent"].strip('"')
    except IndexError as e:
        definition = e

    # if the intent is a definition, create a mongo entry.
    if definition == "Definition":
        dbquery = collection.find_one({"Question": keyword})
        if dbquery is not None:
            top_answer = collection.find({"Question": keyword}).sort('Vote', -1).limit(1)
            for x in top_answer:
                dbanswer = x["Answer"]
                response["output"]["generic"][0]["text"] = dbanswer # replace initial response in json with another string
        else:

            try:
                # collection.create_index([("Question", pymongo.TEXT)], unique=True)  # make question unique
                mongopost = {
                    "Question": keyword,
                    "Answer": answer,
                    "Vote": 1
                }
                collection.insert_one(mongopost)
            except: # pass to escape exception and do nothing
                pass    # if it already exists.. maybe post/update(mongodb) the new answer here


    return jsonify(response)


@app.route('/update/', methods=["GET", "POST"])
def update():
    suggested_answer = request.form["sug_answer"]

    find_last = collection.find().sort([('_id', -1)]).limit(1)
    for record in find_last:
        question = record["Question"]

    mongopost = {
        "Question": question,
        "Answer": suggested_answer,
        "Vote": 0
    }
    collection.insert_one(mongopost)

    # collection.update_one({"Question": question}, {"$set": {"Answer": suggested_answer}})
    return '', 204





@app.route('/vote/', methods=["GET", "POST"])
def vote():
    # this will only increment the vote of the last item added to the database
    find_last = collection.find().sort([('_id', -1)]).limit(1)
    for record in find_last:
        answer = record["Answer"]
        collection.update_one({"Answer": answer}, {"$inc": {"Vote": 1}})



    return '', 204







@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html', e=e), 404


if __name__ == "__main__":
    app.run(debug=True)
