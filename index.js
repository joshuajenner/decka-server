require('dotenv').config()

const express = require('express');
const server = express()
const port = process.env.PORT || 3000;

const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');


// new comment
// https://romantic-bardeen-dffbd3.netlify.app
// http://localhost:5000
server.use(bodyParser.json());
server.use(cors());

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
    }
  } else if (req.body.type == 1) {
    data = {
      title: req.body.title,
      type: req.body.type,
    }
  } else if (req.body.type == 2) {
    data = {
      title: req.body.title,
      type: req.body.type,
    };
  } else if (req.body.type == 3) {
    data = {
      title: req.body.title,
      type: req.body.type,
    };
  }

  const createBoard = await db.collection(req.body.uid).doc(req.body.did).collection("boards").add(data).then(
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
    dnd: req.body.dnd,
    xval: 0,
    yval: 0
  }
  const createCard = await db.collection(req.body.uid).doc(req.body.did).collection("cards").add(data).then(
    function (docRef) {
      res.send({ id: docRef.id });
    });

});


// ---------------------------------------------- Board Operations

server.post('/updateboard', async (req, res) => {
  await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).update({
    title: req.body.title
  })
  res.send({ message: "Success" });
});

server.post('/deleteboard', async (req, res) => {
  await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).delete()
  res.send({ message: "Success" });
});

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
    let cards = await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(cols[col].id).collection('cards').orderBy('order').get();
    cols[col].cards = [];
    cards.forEach(c => {
      cols[col].cards.push({
        id: c.id,
        title: c.data().title,
        content: c.data().content,
        order: c.data().order,
        dnd: c.data().dnd,
        xval: c.data().xval,
        yval: c.data().yval
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
  let ord = 0;
  for (card in req.body.cards) {
    isFound = false;
    snapshot.forEach(doc => {
      if (doc.id === req.body.cards[card].id) {
        isFound = true;
        db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(req.body.cid).collection("cards").doc(req.body.cards[card].id).update({
          title: req.body.cards[card].title,
          content: req.body.cards[card].content,
          order: ord
        })
        ord += 1;
      }
    });
    if (!isFound) {
      db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(req.body.cid).collection("cards").doc(req.body.cards[card].id).set({
        title: req.body.cards[card].title,
        content: req.body.cards[card].content,
        order: req.body.cards[card].order,
        dnd: req.body.cards[card].dnd,
        xval: 0,
        yval: 0
      })

    }
  }

  snapshot.forEach(doc => {
    isFound = false;
    for (card in req.body.cards) {
      if (doc.id === req.body.cards[card].id) {
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
      dnd: doc.data().dnd,
      xval: doc.data().xval,
      yval: doc.data().yval
    }
    )
  });
  res.send(cards)
});

server.post('/getgridcards', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection('cards').get();
  let cards = [];
  snapshot.forEach(doc => {
    //   console.log(doc.id, '=>', doc.data());
    cards.push({
      id: doc.id,
      title: doc.data().title,
      content: doc.data().content,
      order: doc.data().order,
      dnd: doc.data().dnd,
      xval: 0,
      yval: 0
    }
    )
  });
  res.send(cards)
});

server.post('/getfreecards', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection('cards').get();
  let cards = [];
  snapshot.forEach(doc => {
    //   console.log(doc.id, '=>', doc.data());
    cards.push({
      id: doc.id,
      title: doc.data().title,
      content: doc.data().content,
      order: doc.data().order,
      dnd: doc.data().dnd,
      xval: doc.data().xval,
      yval: doc.data().yval
    }
    )
  });
  res.send(cards)
});

server.post('/getgridcards', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection('cards').get();
  let cards = [];
  snapshot.forEach(doc => {
    //   console.log(doc.id, '=>', doc.data());
    cards.push({
      id: doc.id,
      title: doc.data().title,
      content: doc.data().content,
      order: doc.data().order,
      dnd: doc.data().dnd,
      xval: 0,
      yval: 0
    }
    )
  });
  res.send(cards)
});

// server.post('/getcalendarcards', async (req, res) => {
//   let monthLength = new Date(req.body.year, req.body.month + 1, 0).getDate();

//   for () {

//   }


//   const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(String(req.body.year)).doc(req.body.month).collection("days").get();
//   let cards = [];
//   snapshot.forEach(doc => {
//     //   console.log(doc.id, '=>', doc.data());
//     cards.push({id: doc.id, days: []})
//   });



//   for (d in monthLength) {
//     let d2 =  d + 1;
//     const snap2 = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(String(req.body.year)).doc(cards[c].id).collection('days').doc(d2).collection("cards").get();
//     if (!doc.exists) {
//       cards[d].days.push({id: d, cards:[]})
//     } else {
//       const snap3 = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(String(req.body.year)).doc(cards[c].id).collection('days').doc(d2).collection("cards").get();
//       snap3.forEach(doc => {
//         //   console.log(doc.id, '=>', doc.data());
//         cards[d].days[d].cards.push({
//           //           id: doc.id,
//           //           title: doc.data().title,
//           //           content: doc.data().content,
//           //           order: doc.data().order,
//           //           dnd: doc.data().dnd,})
//           //       });
//       });
//     }

//   }
//   res.send(cards)
// });



server.post('/getcalendarcards', async (req, res) => {
  let month = { id: req.body.month, days: [] };
  let monthLength = new Date(req.body.year, req.body.month + 1, 0).getDate();

  for (let day = 1; day <= monthLength; day++) {
    month.days.push({
      id: day,
      cards: []
    })
    const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(req.body.year).doc(month.id).collection('days').doc(day.toString()).collection("cards").get();
    snapshot.forEach(doc => {
      month.days[day - 1].cards.push({
        id: doc.id,
        title: doc.data().title,
        content: doc.data().content,
        order: doc.data().order,
        dnd: doc.data().dnd
      })
    });
  }
  res.send(month);
});


server.post('/updatecalendarcards', async (req, res) => {
  let isFound;
  for (card in req.body.cards) {
    db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(req.body.year).doc(req.body.month).collection('days').doc(req.body.day).collection("cards").doc(req.body.cards[card].id).set({
      title: req.body.cards[card].title,
      content: req.body.cards[card].content,
      order: req.body.cards[card].order,
      dnd: req.body.cards[card].dnd,
    })
  }

  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(String(req.body.year)).doc(String(req.body.month)).collection('days').doc(req.body.day).collection("cards").get();

  snapshot.forEach(doc => {
    isFound = false;
    for (card in req.body.cards) {
      if (doc.id === req.body.cards[card].id) {
        isFound = true;
      }
    }
    if (!isFound) {
      db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(String(req.body.year)).doc(String(req.body.month)).collection('days').doc(req.body.day).collection("cards").doc(doc.id).delete();
    }
  });
});


///////////////////////////////////

// server.post('/getcalendarcards', async (req, res) => {
//   let months = [];
//   let monthLength;

//   for (let month = 0; month < 12; month++) {
//     months.push({id: month, days: []})
//     monthLength = new Date(req.body.year, month + 1, 0).getDate();

//     for (let day = 1; day < monthLength; day++) {
//       months[month].days.push({
//         id: day,
//         cards: []
//       })
//       const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(String(req.body.year)).doc(String(month)).collection('days').doc(String(day)).collection("cards").get();
//       snapshot.forEach(doc => {
//         months[month].days[day].cards.push({
//           id: doc.id,
//           title: doc.data().title,
//           content: doc.data().content,
//           order: doc.data().order,
//           dnd: doc.data().dnd
//         })
//       });
//     }
//     console.log(month);
//   }
//   res.send(months);
//   console.log("job's done");
// });

// server.post('/getcalendarcards', async (req, res) => {

//   for (let m = 0; m < 12; m++) {
//     const doc = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(String(req.body.year)).doc(m).get();
//     if (!doc.exists) {
//       console.log('No such document!');
//     } else {
//       console.log('Document data:', doc.data());
//     }
//   }

//   const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(String(req.body.year)).get();
//   let months = [];
//   snapshot.forEach(doc => {
//     //   console.log(doc.id, '=>', doc.data());
//     months.push({id: doc.id, days: []})
//   });


//   for (c in months) {
//     const snap2 = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(String(req.body.year)).doc(months[c].id).collection('days').get();
//     snap2.forEach(doc => {
//       //   console.log(doc.id, '=>', doc.data());
//       months[c].days.push({id: doc.id, months:[]})
//     });
//   }

//   for (m in months) {
//     for (d in months[m].days) {
//       const snap3 = await db.collection(req.body.uid).doc(req.body.did).collection('boards').doc(req.body.bid).collection(String(req.body.year)).doc(months[m].id).collection('days').doc(months[m].days[d].id).collection("cards").get();
//       snap3.forEach(doc => {
//         //   console.log(doc.id, '=>', doc.data());
//         months[m].days[d].months.push({
//           id: doc.id,
//           title: doc.data().title,
//           content: doc.data().content,
//           order: doc.data().order,
//           dnd: doc.data().dnd,})
//       });
//     }
//   }

//   res.send(months)
// });

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
    // isFound = false;
    // snapshot.forEach(doc => {
    //   if (doc.id === req.body.cards[card].id) {
    //     isFound = true;
    //   }
    // });
    // if (!isFound) {
    db.collection(req.body.uid).doc(req.body.did).collection("cards").doc(req.body.cards[card].id).set({
      title: req.body.cards[card].title,
      content: req.body.cards[card].content,
      order: req.body.cards[card].order,
      dnd: req.body.cards[card].dnd,
      xval: 0,
      yval: 0
    })
    // }
  }

  snapshot.forEach(doc => {
    isFound = false;
    for (card in req.body.cards) {
      if (doc.id === req.body.cards[card].id) {
        isFound = true;
      }
    }
    if (!isFound) {
      db.collection(req.body.uid).doc(req.body.did).collection("cards").doc(doc.id).delete();
    }
  });

  res.send("Success");
});

server.post('/updategridcards', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("cards").get();
  let isFound;
  for (card in req.body.cards) {
    // isFound = false;
    // snapshot.forEach(doc => {
    //   console.log(doc.id);
    //   console.log(req.body.cards[card].id);
    //   if (doc.id === req.body.cards[card].id) {
    //     isFound = true;
    //   }
    // });
    // if (!isFound) {
    db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("cards").doc(req.body.cards[card].id).set({
      title: req.body.cards[card].title,
      content: req.body.cards[card].content,
      order: req.body.cards[card].order,
      dnd: req.body.cards[card].dnd,
      xval: 0,
      yval: 0
    })
    // }
  }

  snapshot.forEach(doc => {
    isFound = false;
    for (card in req.body.cards) {
      if (doc.id === req.body.cards[card].id) {
        isFound = true;
      }
    }
    if (!isFound) {
      db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("cards").doc(doc.id).delete();
    }
  });
  res.send("Success");
});

server.post('/updatefreecards', async (req, res) => {
  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("cards").get();
  let isFound;
  for (card in req.body.cards) {
    // isFound = false;
    // snapshot.forEach(doc => {
    //   if (doc.id === req.body.cards[card].id) {
    //     isFound = true;
    //   }
    // });
    // if (!isFound) {
    db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("cards").doc(req.body.cards[card].id).set({
      title: req.body.cards[card].title,
      content: req.body.cards[card].content,
      order: req.body.cards[card].order,
      dnd: req.body.cards[card].dnd,
      xval: req.body.cards[card].xval,
      yval: req.body.cards[card].yval
    })
    // }
  }

  snapshot.forEach(doc => {
    isFound = false;
    for (card in req.body.cards) {
      if (doc.id === req.body.cards[card].id) {
        isFound = true;
      }
    }
    if (!isFound) {
      db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("cards").doc(doc.id).delete();
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

server.post('/deletecolumn', async (req, res) => {
  // const cardsInCol = await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(req.body.cid).collection("cards").get();
  // cardsInCol.forEach(doc => {
  //   db.collection(req.body.uid).doc(req.body.did).collection("cards").doc(doc.id).set({
  //     title: doc.data().title,
  //     content: doc.data().content,
  //     order: doc.data().order,
  //     dnd: doc.data().dnd
  //   })
  //   db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(req.body.cid).collection("cards").doc(doc.id).delete();
  // });

  const snapshot = await db.collection(req.body.uid).doc(req.body.did).collection("boards").doc(req.body.bid).collection("columns").doc(req.body.cid);
  snapshot.delete();
  res.send({ message: "Success" })
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

server.post('/deleteuser', async (req, res) => {
  const collectionRef = db.collection(req.body.uid);
  const query = collectionRef.orderBy('__name__')

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });

  async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
      // When there are no documents left, we are done
      resolve();
      return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve);
    });
  }
});

// ---------------------------------------------- 

server.listen(port, () => {
  console.log(`Server is listening at https://127.0.0.1:3000`);
});