const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const  port = process.env.PORT || 5000;
 
//  middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message: 'unauthorized access'})
  }

  const token = authorization.split(' ')[1];


  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
    if(err){
      return res.status(401).send({error:true,message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next()
  })
}

// get data at server home
app.get('/', (req,res)=>{
    res.send('craft is going on')
})

// mongoDB connection and operations

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lruiqni.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // all About Jwt

    app.post('/jwt',(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})

      res.send({ token })

    })



// database collections
const allDataCollection = client.db("summerCamp").collection("allData");
const usersCollection = client.db("summerCamp").collection("users");
const classesCollection = client.db("summerCamp").collection("classes");

app.get('/allData', async (req,res)=>{

    const result = await allDataCollection.find().toArray();
    res.send(result)

})

// selected classes collection

app.post('/classes', async (req,res)=>{
  const item = req.body
  const result = await classesCollection.insertOne(item);
  res.send(result)
})

app.get('/users',async (req,res)=>{
  const result = await usersCollection.find().toArray();
  res.send(result)

})


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log(`craft is running at port : ${port}` )
})
