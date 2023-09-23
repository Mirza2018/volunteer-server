const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("Server is On")
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4fvtstz.mongodb.net/?retryWrites=true&w=majority`;

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

        const volunteerCollection = client.db("volunteerDB").collection("volunteer");
        const donationCollection = client.db("volunteerDB").collection("donation");

        app.get('/volunteer', async (req, res) => {
            const result = await volunteerCollection.find().toArray();
            res.send(result)
        })

        app.get('/volunteer/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            const result = await volunteerCollection.findOne(filter);
            res.send(result)
        })

        app.post('/donation', async (req, res) => {
            const infos = req.body;
            const result = await donationCollection.insertOne(infos);
            res.send(result)
        })

        app.get('/volunteerpage', async (req, res) => {
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await donationCollection.find(query).toArray()
            res.send(result)

        })
        // app.get('/adminpage', async (req, res) => {
        //     const result = await donationCollection.find().toArray()
        //     res.send(result)
        // })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log("port no is", port);
})