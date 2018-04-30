const express       = require('express');
const router        = express.Router();
const bodyParser    = require('body-parser');
const environment   = 'development'; //'production'
const configuration = require('../knexfile.js')[environment];
const knex          = require('knex')(configuration);
const randomColor   = require('randomcolor');
const bcrypt        = require('bcrypt');
const cookieSession = require('cookie-session');
const cryptico      = require('cryptico');
const nodemailer    = require('nodemailer');
const encryptVars   = require('../encryptVars.js');
const aiApi         = require('../aiApi');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}))

router.use(cookieSession({
  name: 'session',
  keys: ['I dont know.', 'Just work so that I can be done with this.']
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
      .from('counsellors')
      .where({email: req.body.email})
    .then(response => {
      bcrypt.compare(req.body.password, response[0].password_hash)
        .then(passMatch => {
          //set session here
          if (passMatch === true) {
            req.session.userID = response[0].counsellor_id
            req.session.email  = response[0].email
            req.session.counsellorName = response[0].full_name
            console.log("Session Set")
            res.send(req.session)
          } else {
            console.log("THAT IS WEIRD.")
            res.sendStatus(404)
          }
        })
    })
    .catch(err => {
      console.log("User does not exist in the db", err)
      const message = {
        status: 404,
        content: "I can't let you in. I dont know you. Try signing up or checking your login details."
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
      .insert([{
        full_name: req.body.name,
        email: req.body.email,
        password_hash: hashedPassword,
        name_of_practice: req.body.practice_name,
        name_avatar_url: `https://ui-avatars.com/api/?name=${req.body.name}&background=${randomColor().split('#')[1]}&color=fff&rounded=true&size=256`
      }])
    .then(response => {
      console.log("Counsellor inserted.",response)
      knex('counsellors')
        .select('*')
        .where({
          email: req.body.email
        })
      .then(response => {
        console.log("response of user", response)
        //set session using cookie session here.
        req.session.userID = response[0].counsellor_id
        req.session.email  = response[0].email
        req.session.counsellorName = response[0].full_name

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
  }
})

router.get('/latestJournalAnalysis/:clientID', (req, res) => {
  //change route to bring out latest journal analysis based on user selected.
  if(req.session.userID) {
    console.log("requested")

    knex.select('*')
      .from('journal_entries').where({
        entry_make_id: req.params.clientID
      })
    .then(response => {
      console.log("RESPONSEÊ", response)
      var sortedEntries = response.sort((a, b) => b.created_at - a.created_at)

      var CipherText = sortedEntries[0].encrypted_content
      var DecryptionResult = cryptico.decrypt(CipherText, encryptVars.MjRSAkey)
      var journal_entry = DecryptionResult.plaintext

      Promise.all([
        aiApi.getPersonalityInsights(journal_entry),
        aiApi.analyzeTone(journal_entry),
        aiApi.understandNaturalLanguage(journal_entry)
      ])
      .then(([insightJson, toneJson, languageJson]) => {

        const personalityData = insightJson.personality
        const toneData = toneJson.document_tone.tone_categories
        const needsData = insightJson.needs
        const valuesData = insightJson.values
        const keywordsData = languageJson.keywords

        console.log("HEILLO", toneData)

        const chartData = {
          personalityChartData: {
            labels: [],
            data: []
          },
          toneChartData: {
            labels: [],
            data: []
          },
          needsChartData: {
            labels: [],
            data: []
          },
          valuesChartData: {
            labels: [],
            data: []
          },
          keywordsChartData: {
            labels: [],
            data: []
          }
        }

        const personalityLabels = [];
        const personalityNumbers = [];

        const toneLabels = [];
        const toneNumbers = [];

        const needsLabels = [];
        const needsNumbers = [];

        const valuesLabels = [];
        const valuesNumbers = [];

        const keywordsLabels = [];
        const keywordsNumbers = [];

        personalityData.map(trait => {
          personalityLabels.push(trait.name)
          personalityNumbers.push(Math.round((trait.percentile * 100)))
        })

        toneData.map(category => {
          if(category.category_name === 'Emotion Tone') {
            category.tones.map(tone => {
              toneLabels.push(tone.tone_name)
              toneNumbers.push(Math.round((tone.score * 100)))
            })
          }
        })

        needsData.map(need => {
          needsLabels.push(need.name)
          needsNumbers.push(Math.round((need.percentile * 100)))
        })

        valuesData.map(value => {
          valuesLabels.push(value.name)
          valuesNumbers.push(Math.round((value.percentile * 100)))
        })

        keywordsData.map(word => {
          keywordsLabels.push(word.text)
          keywordsNumbers.push(Math.round((word.relevance * 100)))
        })

        chartData.personalityChartData.labels = personalityLabels;
        chartData.personalityChartData.data = personalityNumbers;

        chartData.toneChartData.labels = toneLabels;
        chartData.toneChartData.data = toneNumbers;

        chartData.needsChartData.labels = needsLabels;
        chartData.needsChartData.data = needsNumbers;

        chartData.valuesChartData.labels = valuesLabels;
        chartData.valuesChartData.data = valuesNumbers;

        chartData.keywordsChartData.labels = keywordsLabels;
        chartData.keywordsChartData.data = keywordsNumbers;

        res.send(chartData);
      })
    })
    .catch(err => {
      console.log("NONE EXIST?", err)
      const message = {
        status: 404,
        content: 'This user has not made a journal entry as of yet.'
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


router.get('/clients/all', (req, res) => {
  if (req.session.userID) {
    console.log("sending")
    knex.select('*')
      .from('clients')
      .where({
        client_counsellor_id: req.session.userID
      })
    .then(users => {
      console.log('Hmm',users)
      res.send(users)
    })
  } else {
    const message = {
      status: 401,
      content: 'Unidentified request. You do not seem to be logged in.'
    }
    res.send(message)
  }
})

router.get('/clients/:clientID', (req, res) => {
  if (req.session.userID) {
    console.log("SOSOSO", req.params.clientID)
    // const user = users.find(user => user.id == req.params.clientID)
    // console.log(user)
    // res.send(user)
    knex('clients')
      .select('*')
      .where({
        client_id: req.params.clientID,
        client_counsellor_id: req.session.userID
      })
    .then(user => {
      console.log('Here',user)
      res.send(user)
    })
    .catch(err => {
      console.log("This client might not exist/is not your client", err)
    })
  } else {
    const message = {
      status: 401,
      content: 'Unidentified request. You do not seem to be logged in.'
    }
    res.send(message)
  }
})

router.post('/clients/invite', (req, res) => {
  if(req.session.userID) {
    console.log("INVITE THIS CLIENT", req.body.email)
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'parthpatelgee@gmail.com',
        pass: process.env.EMAILPASS
      }
    });

    // setup email data with unicode symbols
    let mailOptions = {
      from: `${req.session.counsellorName} <${req.session.email}>`, // sender address
      to: req.body.email, // list of receivers
      subject: 'You have been invited by your counsellor to join MyndJournal', // Subject line
      text: `Hi,
             You have been invited by your counsellor, ${req.session.counsellorName} to join MyndJournal!
             Click http://localhost:3000/signup?newClient=true&counsellorEmailRef=${req.session.email}&clientEmail=${req.body.email} to signup!` // plain text body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message sent: %s', info.messageId)
      res.send(true)
    });
  } else {
    const message = {
      status: 401,
      content: 'Unidentified request. You do not seem to be logged in.'
    }
    res.send(message)
  }
})

router.get('/counsellorData', (req, res) => {
  if (req.session.userID) {
    knex('counsellors')
      .select('*')
      .where({
        counsellor_id: req.session.userID
      })
    .then(counsellorData => {
      res.send(counsellorData)
    })
  } else {
    const message = {
      status: 401,
      content: 'Unidentified request. You do not seem to be logged in.'
    }
    res.send(message)
  }
})

router.post('/submit-note', (req, res) => {
  if (req.session.userID) {
    var PlainText = req.body.content;
    var EncryptionResult = cryptico.encrypt(PlainText, encryptVars.MjPublicKeyString);
    console.log('NOTE', req.body)
    knex('clients')
      .select('*')
      .where({
        email: req.body.clientEmail
      })
    .then(client => {
      console.log("THIS IS THE CLIENT", client)
      knex('counsellor_notes')
        .insert([{
          title: req.body.title,
          encrypted_content: EncryptionResult.cipher,
          for_id: client[0].client_id,
          note_maker_id: req.session.userID
        }])
      .then(response => {
        console.log("Note has been encrypted and inserted.")
        knex('counsellor_notes')
          .select('*')
          .where({
            title: req.body.title
          })
        .then(note => {
          const message = {
            status: 200,
            content: 'Note encrypted and inserted successfully.',
            noteId: note[0].note_id
          }
          res.send(message)
        })
      })
      .catch(err => {
        console.log("Error!", err)
      })
    })
    .catch(err => {
      console.log("NO!", err)
      const message = {
        status: 404,
        content: 'The client this note is about was not found. I do not recognize this email.'
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

router.get('/note/byEmail/:clientEmail', (req, res) => {
  if(req.session.userID) {
    knex('clients')
      .select('*')
      .where({
        email: req.params.clientEmail
      })
    .then(response => {
      console.log("HELLO?", response)
      knex('counsellor_notes')
        .select('*')
        .where({
          for_id: response[0].client_id
        })
      .then(notes => {
        const sortedNotes = notes.sort((a,b) => b.created_at - a.created_at)
        console.log("FINAL SORTED NOTES", sortedNotes)
        res.send(sortedNotes)
      })
    })
  } else {
    const message = {
      status: 401,
      content: 'Unidentified request. You do not seem to be logged in.'
    }
    res.send(message)
  }
})

router.get('/note/byId/:noteId', (req, res) => {
  console.log("NAMASTAY", req.params.noteId)
  if (req.session.userID) {
    knex('counsellor_notes')
      .select('*')
      .where({
        note_id: req.params.noteId,
        note_maker_id: req.session.userID
      })
    .then(note => {
      console.log("Specific Note", note.length)

      if (note.length === 0) {
        console.log("WILL SEND 403 NOW.")
        const message = {
          status: 403,
          content: 'You are not the maker of this note. You cannot access it.'
        }
        res.send(message)
      }

      var CipherText = note[0].encrypted_content
      var DecryptionResult = cryptico.decrypt(CipherText, encryptVars.MjRSAkey)
      var counsellorNote = DecryptionResult.plaintext

      const responseObj = {
        status: 200,
        noteTitle: note[0].title,
        content: counsellorNote
      }

      res.send(responseObj)

    })
    .catch(err => {
      const message = {
        status: 403,
        content: 'You are not the maker of this note. You cannot access it.'
      }
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
  req.session = null
  res.sendStatus(200)
})

router.post('/getInTouch', (req, res) => {
  console.log(req.body)
  let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'parthpatelgee@gmail.com',
        pass: 'Tatti814880'
      }
    });

  // setup email data with unicode symbols
  let mailOptions = {
    from: `<${req.body.email}>`, // sender address
    to: 'parthpatelgee@gmail.com', // list of receivers
    subject: 'A counsellor is interested and wants to talk.', // Subject line
    text: `${req.body.message}` // plain text body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
      const message = {
        status: 400,
        message: 'There seems to be an issue, try again later.'
      }
      res.send(message)
    }

    console.log('Message sent: %s', info.messageId)
    const message = {
      status: 200,
      message: 'Email Sent.'
    }
    res.send(message)
  });
})


module.exports = router;