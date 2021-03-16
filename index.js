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


// ---------------------------------------------- Authentication

// server.post('/login', async (req, res) => {
//   admin
//     .auth()
//     .getUserByEmail(req.body.email)
//     .then((userRecord) => {
//       // See the UserRecord reference doc for the contents of userRecord.
//       console.log(`Successfully fetched user data: ${userRecord.toJSON()}`);
//       res.send(userRecord.toJSON());
//     })
//     .catch((error) => {
//       console.log('Error fetching user data:', error);
//     });
// })

// ---------------------------------------------- New

server.post('/newdeck', async (req, res) => {
  const doc = await db.collection(req.body.uid).add({
    title: req.body.title
  }).then(
    res.send("Success")
  );
});

server.post('/newboard', async (req, res) => {
  let data;
  if (req.body.type == 0) {
    data = {
      title: req.body.title,
      type: req.body.type,
      cards: []
    }
  } else if (req.body.type == 1) {
    data = {
      title: req.body.title,
      type: req.body.type,
      columns: []
    }
  };

  const createCard = await db.collection(req.body.uid).doc(req.body.did).collection("boards").add(data).then(
    res.send("Success")
  );
});

server.post('/newcard', async (req, res) => {
  const data = {
    title: req.body.title,
    content: req.body.content
  }
  const createCard = await db.collection(req.body.uid).doc(req.body.did).collection("cards").add(data).then(
    res.send("Success")
  );
});


// ---------------------------------------------- Board Operations

server.post('/newcolumn', async (req, res) => {
  const data = {
    title: req.body.title,
    order: req.body.order,
  }
  await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").add(data).then(
    res.send("Success")
  );
});

server.post('/getcolumns', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").get();
  let cols = [];
  snapshot.forEach(doc => {
    cols.push({
      id: doc.id,
      order: doc.data().order,
      title: doc.data().title
    })
  });
  for (col in cols) {
    let cards = await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(cols[col].id).collection('cards').get();
    cols[col].cards = [];
    cards.forEach(c => {
      cols[col].cards.push({
        id: c.id,
        refID: c.data.refID,
        order: c.data().order
      })
    })
  }
  res.send(cols);
});

// ---------------------------------------------- Get

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

server.post('/getdeckboards', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection('boards').get();
  let boards = [];
  snapshot.forEach(doc => {
    //   console.log(doc.id, '=>', doc.data());
    if (doc.data().type == 0) {
      boards.push({
        id: doc.id,
        title: doc.data().title,
        type: doc.data().type
      })
    } else if (doc.data().type == 1) {
      boards.push({
        id: doc.id,
        title: doc.data().title,
        type: doc.data().type,
        columns: doc.data().columns
      })
    } else {
      boards.push({
        id: doc.id,
        title: doc.data().title,
        type: doc.data().type
      })
    }

  });
  res.send(boards)
});

server.post('/getdeckcards', async (req, res) => {
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

// ---------------------------------------------- Update

server.post('/updatedeck', async (req, res) => {
  await db.collection(req.body.uid).doc(req.body.did).update({
    title: req.body.title
  }).then(
    res.send("Success")
  );
});

server.post('/updatecard', async (req, res) => {
  await db.collection(req.body.uid).doc(req.body.did).collection("cards").doc(req.body.id).update({
    title: req.body.title,
    content: req.body.content
  }).then(
    res.send("Success")
  );
});

// ---------------------------------------------- Delete

server.post('/deletedeck', async (req, res) => {
  await db.collection(req.body.uid).doc(req.body.did).delete().then(
    res.send("Success")
  );
});

server.post('/deletecard', async (req, res) => {
  await db.collection(req.body.uid).doc(req.body.did).collection('cards').doc(req.body.id).delete().then(
    res.send("Success")
  );
});

// ---------------------------------------------- 

server.listen(port, hostname, () => {
  console.log(`Server is listening at https://127.0.0.1:300`);
});