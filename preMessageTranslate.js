/**
 *
 * main() will be run when you invoke this action
 *
 * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
 *
 * @return The output of this action, which must be a JSON object.
 *
 */

 let rp = require("request-promise");
 let _ = require("lodash");
 ​
 function main(params) {
     console.log("Cloud Function PreMessageTranslation started**********************");
     console.log("Before translation in PRE webhook======================");
     console.log(JSON.stringify(params));

    // check if lang_id is stored from previous turns. 
    // If lang_id is stored from the previous turns, stored lang_id will be used for the translation at the current turn
    var lang_id = _.get(params, 'payload.context.skills["main skill"].user_defined.lang_id');

    if (lang_id != "none" && lang_id != "" && lang_id != null) {
        _.set(params, 'payload.context.skills["main skill"].user_defined["language"]', lang_id);
    }

    let user_input = params.payload.input.text;
    user_input.toLowerCase();
     if (user_input != "" && user_input != "yes" && user_input != "no") {
         const options = {
         method: "POST",
         url:
             "https://api.us-south.language-translator.watson.cloud.ibm.com/instances/6c929b81-0590-424c-88b3-a1fa9b424da8/v3/identify?version=2018-05-01",
         auth: {
             username: "apikey",
             password: "e6ZwlpB2aOmIIWzz6-CoVN_jT0XVWj8ltsv9auk5GTDh",
         },
         headers: {
             "Content-Type": "text/plain",
         },
         body: [params.payload.input.text],
         json: true,
         };
         return rp(options).then((res) => {
         var defaultDialogLanguageCode = "en";
 
         const confidence = _.get(res, "languages[0].confidence");
         console.log("confidence " + confidence);
         const language =
             confidence > 0.5 ? _.get(res, "languages[0].language") : defaultDialogLanguageCode;
         //_.set(params, 'payload.context.skills["main skill"].user_defined["language"]', language);

        // update lang_id only when it has not been set from previous turns. 
        if (lang_id == "none" || lang_id == "" || lang_id == null) {
            _.set(params, 'payload.context.skills["main skill"].user_defined["lang_id"]', language);
            _.set(params, 'payload.context.skills["main skill"].user_defined["language"]', language);
            lang_id = language;
        }

        console.log("After IDENTIFYing language ID in PRE webhook======================");
        console.log(JSON.stringify(params));
 
         if (lang_id !== defaultDialogLanguageCode) {
             const options = {
             method: "POST",
             url:
                "https://api.us-south.language-translator.watson.cloud.ibm.com/instances/6c929b81-0590-424c-88b3-a1fa9b424da8/v3/identify?version=2018-05-01",
             auth: {
                username: "apikey",
                password: "e6ZwlpB2aOmIIWzz6-CoVN_jT0XVWj8ltsv9auk5GTDh",
             },
             body: {
                 text: [params.payload.input.text],
                 target: defaultDialogLanguageCode,
                 source: lang_id
             },
             json: true,
             };
             return rp(options).then((res) => {
             console.log("PRE-Translate - translating");
             console.log(JSON.stringify(res));
             params.payload.context.skills["main skill"].user_defined["original_input"] =
                 params.payload.input.text;
             params.payload.input.text = res.translations[0].translation;

             console.log("After translation in PRE webhook======================");
             console.log(JSON.stringify(params));
             // const result = {
             //   body: params,
             // };
             
            return {
                body: params,
            };
             });
         } else {
             console.log("NO translation in PRE webhook======================11111111111111");
             //console.log(JSON.stringify(params));
             // const result = {
             //   body: params,
             // };
             return {
                body: params,
            };
          }
         });
     } else {
         // still translate even if the node does not have user input. Otherwise, prompts will be in mix of languages
         // Language setting was done at the begining of the function
         //params.payload.context.skills["main skill"].user_defined["language"] = "none";       
         console.log("NO translation in PRE webhook======================2222222222222");

         if (lang_id == "none" || lang_id == "" || lang_id == null) {
            params.payload.context.skills["main skill"].user_defined["language"] = "none"; 
         }

         // const result = {
         //   body: params,
         // };
         return {
            body: params,
        };
  }
 }