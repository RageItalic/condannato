const PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');
const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

const personalityInsights = new PersonalityInsightsV3({
  username: '20c9db54-8f08-4a8f-a497-0b68a0c1e68d',
  password: 'xcxNX0eX8ff3',
  version_date: '2016-10-19',
  url: 'https://gateway.watsonplatform.net/personality-insights/api/'
});

const toneAnalyzer = new ToneAnalyzerV3({
  username: '45819aa6-5537-4598-8a3a-d523c2a80a6d',
  password: '4ECbmuSRgDWd',
  version_date: '2016-05-19',
  url: 'https://gateway.watsonplatform.net/tone-analyzer/api/'
});

const nlu = new NaturalLanguageUnderstandingV1({
  username: '53a6c306-f1b1-43f9-9a1f-ed2b8fe54b81',
  password: 'zkg74NtogLs6',
  version_date: '2017-02-27',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
});

module.exports = {
  getPersonalityInsights: function (text) {
    return new Promise((res) => {
      personalityInsights.profile(
        {
          content: text,
          content_type: 'text/plain',
          consumption_preferences: true
        },
        function(err, insights) {
          if (err) {
            console.log('error:', err);
          } else {
            //console.log(JSON.stringify(insights, null, 2));
            return res(insights);
          }
        }
      );
    })
  },
  analyzeTone: function (text) {
    return new Promise((res) => {
      toneAnalyzer.tone(
        {
          tone_input: text,
          content_type: 'text/plain'
        },
        function(err, tone) {
          if (err) {
            console.log(err);
          } else {
            //console.log(JSON.stringify(tone, null, 2));
            return res(tone)
          }
        }
      );
    })
  },
  understandNaturalLanguage: function (text) {
    return new Promise((res) => {
      nlu.analyze(
        {
          html: text, // Buffer or String
          features: {
            entities: {},
            keywords: {}
          }
        },
          function(err, understood) {
            if (err) {
              console.log('error:', err);
            } else {
              //console.log(JSON.stringify(understood, null, 2));
              res(understood)
            }
          }
      );
    })
  }
}