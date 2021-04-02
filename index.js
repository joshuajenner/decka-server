require('dotenv').config()

const server = require('express')();
// const http = require('http').Server(server);
const bodyParser = require('body-parser');
const cors = require('cors');

const admin = require('firebase-admin');

// const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;


// https://romantic-bardeen-dffbd3.netlify.app
// http://localhost:5000
server.use(bodyParser.json());
server.use(cors({
  origin: 'https://romantic-bardeen-dffbd3.netlify.app/'
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
      function (docRef) {
        res.send({ id: docRef.id });
      }
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
    function (docRef) {
      res.send({ id: docRef.id, ...data });
    }
  );
});

server.post('/newcard', async (req, res) => {
  const data = {
    title: req.body.title,
    content: req.body.content,
    order: req.body.order,
    dnd: req.body.dnd
  }
  const createCard = await db.collection(req.body.uid).doc(req.body.did).collection("cards").add(data).then(
    function (docRef) {
      res.send({ id: docRef.id });
    });

});


// ---------------------------------------------- Board Operations

server.post('/newcolumn', async (req, res) => {
  const data = {
    title: req.body.title,
    dnd: req.body.dnd,
    order: parseInt(req.body.order)
  }
  await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").add(data).then(
    function (docRef) {
      res.send({ id: docRef.id });
    }
  );
});

server.post('/getcolumns', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").orderBy('order').get();
  let cols = [];
  snapshot.forEach(doc => {
    cols.push({
      id: doc.id,
      dnd: doc.data().dnd,
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
        title: c.data().title,
        content: c.data().content,
        order: c.data().order,
        dnd: c.data().dnd
      })
    })
  }
  res.send(cols);
});

server.post('/renamecolumn', async (req, res) => {
  await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(req.body.cid).update(
    {
      title: req.body.title
    }
  ).then(
    res.send("Success")
  );
});

server.post('/updatecolumncards', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(req.body.cid).collection("cards").get();
  let isFound;
  for (card in req.body.cards) {
    isFound = false;
    snapshot.forEach(doc => {
      if (doc.id ===  req.body.cards[card].id) {
        isFound = true;
      }
    });
    if (!isFound) {
      db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(req.body.cid).collection("cards").doc(req.body.cards[card].id).set({
        title: req.body.cards[card].title,
        content: req.body.cards[card].content,
        order: req.body.cards[card].order,
        dnd: req.body.cards[card].dnd
      })
    }
  }

  snapshot.forEach(doc => {
    isFound = false;
    for (card in req.body.cards) {
      if (doc.id ===  req.body.cards[card].id) {
        isFound = true;
      }
    }
    if (!isFound) {
      db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(req.body.cid).collection("cards").doc(doc.id).delete();
    }
  });
  
  res.send("Success");
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
      title: doc.data().title,
      content: doc.data().content,
      order: doc.data().order,
      dnd: doc.data().dnd
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

server.post('/updateallcards', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection("cards").get();
  let isFound;
  for (card in req.body.cards) {
    isFound = false;
    snapshot.forEach(doc => {
      if (doc.id ===  req.body.cards[card].id) {
        isFound = true;
      }
    });
    if (!isFound) {
      db.collection(req.body.uid).doc(req.body.did).collection("cards").doc(req.body.cards[card].id).set({
        title: req.body.cards[card].title,
        content: req.body.cards[card].content,
        order: req.body.cards[card].order,
        dnd: req.body.cards[card].dnd
      })
    }
  }

  snapshot.forEach(doc => {
    isFound = false;
    for (card in req.body.cards) {
      if (doc.id ===  req.body.cards[card].id) {
        isFound = true;
      }
    }
    if (!isFound) {
      db.collection(req.body.uid).doc(req.body.did).collection("cards").doc(doc.id).delete();
    }
  });
  
  res.send("Success");
});

server.post('/reordercolumns', async (req, res) => {
  for (col in req.body.cols) {
    db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(req.body.cols[col].id).update(
      {
        order: parseInt(col)
      }
    )
  }
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

server.listen(port, () => {
  console.log(`Server is listening at https://127.0.0.1:300`);
});