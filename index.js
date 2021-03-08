require('dotenv').config()

const server = require('express')();
// const http = require('http').Server(server);
const bodyParser = require('body-parser');
const cors = require('cors');

const admin = require('firebase-admin');

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

server.use(bodyParser.json());
server.use(cors({
  origin: 'http://localhost:5000'
}));

admin.initializeApp({
  credential: admin.credential.cert({
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.CLIENT_EMAIL,
    projectId: process.env.PROJECT_ID
  }),
  databaseURL: 'https://' + process.env.PROJECT_ID + '.firebaseio.com'
});

const db = admin.firestore();



server.get('/', (req, res) => {
  res.send('Decka Server');
})

server.post('/login', async (req, res) => {
  admin
    .auth()
    .getUserByEmail(req.body.email)
    .then((userRecord) => {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log(`Successfully fetched user data: ${userRecord.toJSON()}`);
      res.send(userRecord.toJSON());
    })
    .catch((error) => {
      console.log('Error fetching user data:', error);
    });
})

server.post('/newdeck', async (req, res) => {
  const doc = await db.collection(req.body.uid).add({
    title: "New Deck",
    content: "This is a fresh deck."
  });
  console.log(doc.id);
});
server.post('/getdecks', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).get();
  let decks = [];
  snapshot.forEach(doc => {
    //   console.log(doc.id, '=>', doc.data());
    decks.push({
      id: doc.id,
      data: doc.data()
    }
    )
  });
  res.send(decks)
});

server.post('/getdeckdata', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection('cards').get();
  let cards = [];
  snapshot.forEach(doc => {
    //   console.log(doc.id, '=>', doc.data());
    cards.push({
      id: doc.id,
      data: doc.data()
    }
    )
  });
  res.send(cards)
});



server.listen(port, hostname, () => {
  console.log(`Server is listening at https://127.0.0.1:300`);
});