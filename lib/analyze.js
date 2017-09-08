const AlchemyLanguageV1     = require('watson-developer-cloud/alchemy-language/v1');
const PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

module.exports = {
  persona: details => {
    let personality_insights = new PersonalityInsightsV3({
      username: process.env.USER,
      password: process.env.PASS,
      version: 'v3',
      version_date: '2016-10-20'
    });

    let params = {
      // Get the content items from the JSON file.
      text: details.desc,
      consumption_preferences: true,
      raw_scores: true,
      headers: {
        'accept-language': 'en',
        'accept': 'application/json'
      }
    };

    if (details.pid) {
      personality_insights.profile(params, (err, resp) => {
        if (err) {
          console.log('error: ', err);
        } else {
          console.log(JSON.stringity(resp));
        }
      });
    } else {
      console.log('no text to analyze');
    }


    return details;
  },
}
