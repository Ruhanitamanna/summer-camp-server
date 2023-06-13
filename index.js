const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')
require('dotenv').config()(process.env.PAYMENT_SECRET_KEY)
const  port = process.env.PORT || 5000;
const corsConfig ={origin:'*',
credentials:true,methods:['GET','POST','PUT','DELETE']}
 
//  middleware
app.use(cors(corsConfig));
app.options("",cors(corsConfig))
app.use(express.json());

const verifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message: 'unauthorized access'})
  }

  const token = authorization.split(' ')[1];


  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
    if(err){
      console.log(err)
      return res.status(403).send({error:true,message: 'forbidden access'})
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

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // await client.connect();
   



// database collections
const allDataCollection = client.db("summerCamp").collection("allData");
const usersCollection = client.db("summerCamp").collection("users");
const classesCollection = client.db("summerCamp").collection("classes");


 // all About Jwt

 app.post('/jwt',(req,res)=>{
  const user = req.body;
  const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})

  res.send({ token })

})

//  verify admin

const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email }
  const user = await usersCollection.findOne(query);
  if (user?.role !== 'admin') {
    return res.status(403).send({ error: true, message: 'forbidden message' });
  }
  next();
}

// for instructor

const verifyInstructor = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email }
  const user = await usersCollection.findOne(query);
  if (user?.role !== 'instructor') {
    return res.status(403).send({ error: true, message: 'forbidden message' });
  }
  next();
}

// users



app.get('/users',verifyJWT,verifyAdmin,  async (req,res)=>{
  const result = await usersCollection.find().toArray();
  res.send(result);
})

// app.get('/users', async (req,res)=>{
//   const result = await usersCollection.find().toArray();
//   res.send(result)

// })

app.post('/users', async(req,res)=>{ 

  const user = req.body;
  console.log(user)
  const query = {email:user.email}
  const existingUser = await usersCollection.findOne(query)
  if(existingUser){
    return res.send({ message:'user already exist'})
  }
  const result = await usersCollection.insertOne(user);
  res.send(result)
})

//  send data to admin and instructor

app.get('/users/admin/:email', verifyJWT, async (req, res) => {
  const email = req.params.email;

  if (req.decoded.email !== email) {
    
    res.send({ admin: false })
  }

  const query = { email: email }
  const user = await usersCollection.findOne(query);
  const result = { admin: user?.role === 'admin' }
  res.send(result);
})
app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
  const email = req.params.email;

  if (req.decoded.email !== email) {
    res.send({ instructor: false })
  }

  const query = { email: email }
  const user = await usersCollection.findOne(query);
  const result = { instructor: user?.role === 'instructor' }
  res.send(result);
})


// admin and instructor making
app.patch('/users/admin/:id', async (req,res)=>
{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
   const updateDoc = {
    $set: {
      role: 'admin'
    },
   };
   const result = await usersCollection.updateOne(filter,updateDoc);
   res.send(result);
})

// Instructor
app.patch('/users/Instructor/:id', async (req,res)=>
{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
   const updateDoc = {
    $set: {
      role: 'Instructor'
    },
   };
   const result = await usersCollection.updateOne(filter,updateDoc);
   res.send(result);
})

app.get('/allData', async (req,res)=>{

    const result = await allDataCollection.find().toArray();
    res.send(result)

})

// selected classes collection

app.get('/classes',  async (req, res) => {
  const email = req.query.email;

  if (!email) {
  return  res.send([]);
  }

  const query = { email: email };
  const result = await classesCollection.find(query).toArray();
 return res.send(result);
});

app.post('/classes', async (req,res)=>{
  const item = req.body
  const result = await classesCollection.insertOne(item);
  res.send(result)
})

app.delete('/classes/:id', async (req,res)=>{
const id = req.params.id;
const query = {_id: new ObjectId(id)};
const result = await classesCollection.deleteOne(query);
res.send(result);

})

// create payment intent

app.post('/create-payment-intent', async (req, res) => {
  const { price } = req.body;
  const amount = parseInt(price * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card']
  });

  res.send({
    clientSecret: paymentIntent.client_secret
  })
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
