const express         = require('express');
const router          = express.Router();
const bodyParser      = require('body-parser');
const environment     = 'development'; //'production'
const configuration   = require('../knexfile.js')[environment];
const knex            = require('knex')(configuration);
const CryptoJS        = require('crypto-js');
const cryptico        = require('cryptico');
const bcrypt          = require('bcrypt');
const cookieSession   = require('cookie-session');
const randomColor     = require('randomcolor');
const responseObjects = require('../responseObjects.js')
const encryptVars     = require('../encryptVars.js');
const aiApi           = require('../aiApi.js');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}))

router.use(cookieSession({
  name: 'session',
  keys: ['I just want this to work. I just want a pilot project.', 'Is that too much to ask?']
}))

router.get('/sessionStatus', (req, res) => {
  console.log("THIS IS QUITE SOMETHING", req.session)
  res.send(req.session)
})


router.post('/login', (req, res) => {
  if (req.session.userID) {
    const message = {
      status: 200,
      content: 'You are already logged in.'
    }
    res.send(message)
  } else {
    console.log(req.body)
    knex.select('*')
      .from('clients')
      .where({email: req.body.email})
    .then(response => {
      bcrypt.compare(req.body.password, response[0].password_hash)
        .then(passMatch => {
          //set session here
          if (passMatch === true) {
            req.session.userID = response[0].client_id
            req.session.email  = response[0].email
            req.session.clientName = response[0].full_name
            console.log("Session Set")
            res.send(req.session)
          } else {
            res.sendStatus(404)
          }
        })
    })
    .catch(err => {
      console.log("ERROR", err)
      const message = {
        status: 404,
        content: 'I cant let you in. I dont know you. Try signing up or checking your login details.'
      }
      res.send(message)
    })
  }
})

router.post('/signup', (req, res) => {
  if (req.session.userID) {
    const message = {
      status: 200,
      content: 'You are already logged in.'
    }
    res.send(message)
  } else {
    console.log(req.body)
    const hashedPassword = bcrypt.hashSync(req.body.confirmPassword, 10)
    console.log("PASS", hashedPassword)
    knex('counsellors')
      .select('*')
      .where({
        email: req.body.counsellorEmail
      })
    .then(counsellor => {
      console.log("COUNSELLOR", counsellor)
      knex('clients')
        .insert([{
          full_name: req.body.name,
          email: req.body.email,
          password_hash: hashedPassword,
          issues_dealing_with: req.body.issues,
          name_avatar_url: `https://ui-avatars.com/api/?name=${req.body.name}&background=${randomColor().split('#')[1]}&color=fff&rounded=true&size=128`,
          client_counsellor_id: counsellor[0].counsellor_id
        }])
      .then(response => {
        console.log("Client inserted.",response)
        knex('clients')
          .select('*')
          .where({
            email: req.body.email
          })
        .then(response => {
          console.log("response of user", response)
          //set session using cookie session here.
          req.session.userID = response[0].client_id
          req.session.email  = response[0].email
          req.session.clientName = response[0].full_name

          console.log("Session Set.", req.session)
          res.send(req.session)
        })
      })
      .catch(err => {
        console.log("User might already exist in the db", err)
        const message = {
          status: 409,
          content: "I already know you. You should login."
        }
        res.send(message)
      })
    })
    .catch(err => {
      console.log('This counsellor does not exist in the database', err)
      const message = {
        status: 409,
        content: "I do not know this counsellor. Check the counsellor email."
      }
      res.send(message)
    })
  }
})


// // The passphrase used to repeatably generate this RSA key.
// const PassPhrase = "But each time I tried I was misunderstood, by you.";

// // The length of the RSA key, in bits.
// const Bits = 1024;

// const MjRSAkey = cryptico.generateRSAKey(PassPhrase, Bits);

// const MjPublicKeyString = cryptico.publicKeyString(MjRSAkey);
// console.log("LOOK HERE", encryptVars.MjPublicKeyString)

router.post('/submit', (req, res) => {
  if (req.session.userID) {

    let responseArray = [];
    let personalityArray = [];
    let toneArray = [];

    var PlainText = req.body.content;
    var EncryptionResult = cryptico.encrypt(PlainText, encryptVars.MjPublicKeyString);

    console.log("LOOK HERE", EncryptionResult.cipher)

    knex('journal_entries')
    .insert([{
      title: req.body.title,
      encrypted_content: EncryptionResult.cipher,
      entry_maker_id: req.session.userID
    }])
    .then(response => {
      console.log("inserted!", response)
    })

    Promise.all([
      aiApi.getPersonalityInsights(req.body.content),
      aiApi.analyzeTone(req.body.content),
      aiApi.understandNaturalLanguage(req.body.content)
    ])
    .then(([insightJson, toneJson, languageJson]) => {
      console.log("I DONT KNOW WHAT THIS IS, ", languageJson)
      responseArray.push("Thank you so much for writing! I hope you're feeling happier after getting everything off your chest!")

      insightJson.personality.map(trait => {
        var traitPercentage = Math.round((trait.percentile * 100))
        if (traitPercentage >= 50) {
          const personalityString = ` You are ${responseObjects.traitDetails[trait.name].higher}`;
          personalityArray.push(personalityString);
        } else if (traitPercentage < 50) {
          const personalityString = ` You seem ${responseObjects.traitDetails[trait.name].lower}`;
          personalityArray.push(personalityString);
        }
      })
      //console.log("look at the personalityArray, ", personalityArray.toString())
      var completePersonalityString = personalityArray.toString();
      responseArray.push(completePersonalityString);

      toneJson.document_tone.tone_categories.map(category => {
        if (category.category_name === 'Emotion Tone') {
          category.tones.map(tone => {
            var tonePercentage = Math.round((tone.score * 100))
            //console.log(`${tone.tone_name}: ${tonePercentage}`)
            if (tonePercentage >= 50) {
              const toneString = ` I can see that you are ${responseObjects.documentToneDetails[tone.tone_name].higher}`;
              toneArray.push(toneString);
            } else if (tonePercentage < 50) {
              const toneString = ` You seem ${responseObjects.documentToneDetails[tone.tone_name].lower}`;
              toneArray.push(toneString);
            }
          })
          var completeToneString = toneArray.toString();
          responseArray.push(completeToneString);
        }
      })
      responseArray.push(" Have a look at the articles down below. I think they'll be helpful to you.");
      res.send(responseArray);
    })
  } else {
    const message = {
      status: 401,
      content: 'Unidentified request. You do not seem to be logged in.'
    }
    res.send(message)
  }
})

router.get('/journal-entries/all', (req, res) => {
  if (req.session.userID) {
    knex('journal_entries')
      .select('*')
      .where({
        entry_maker_id: req.session.userID
      })
    .then(journalEntries => {
      const sortedEntries = journalEntries.sort((a, b) => b.created_at - a.created_at)
      console.log("Sorted Journal Entries", journalEntries)
      res.send(journalEntries)
    })
    .catch(err => {
      console.log("The user has made no journal entries as of yet", err)
      const message = {
        status: 404,
        content: 'You have not made any journal entries yet. Go make some first!'
      }
      res.send(message)
    })
  } else {
    const message = {
      status: 401,
      content: 'Unidentified request. You do not seem to be logged in.'
    }
    res.send(message)
  }
})

router.get('/journal-entries/:id', (req, res) => {
  if (req.session.userID) {
    knex('journal_entries')
      .select('*')
      .where({
        entry_maker_id: req.session.userID,
        entry_id: req.params.id
      })
    .then(response => {
      console.log("RESPONSE JOURNAL ENTRY", response)
      var CipherText = response[0].encrypted_content
      var DecryptionResult = cryptico.decrypt(CipherText, encryptVars.MjRSAkey)
      var journal_entry = DecryptionResult.plaintext
      const message = {
        status: 200,
        title: response[0].title,
        content: journal_entry
      }
      res.send(message)
    })
    .catch(err => {
      console.log("ERROR JOURNAL ENTRY", err)
      const message = {
        status: 400,
        content: "This journal entry might not exist or you might not be the one who create it."
      }
      res.send(message)
    })
  } else {
    const message = {
      status: 401,
      content: 'Unidentified request. You do not seem to be logged in.'
    }
    res.send(message)
  }
})


router.get('/logout', (req, res) => {
  if (req.session.userID) {
    req.session = null;
    const message = {
      status: 200,
      content: 'Logged out successfully.'
    }
    res.send(message)
  } else {
    const message = {
      status: 404,
      content: 'Session not found. Nothing to log out of.'
    }
    res.send(message)
  }
})

module.exports = router;





