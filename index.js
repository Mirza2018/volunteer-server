const express = require('express');
const cors = require('cors');
const app = express();
var jwt = require('jsonwebtoken');
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


const varifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: "Unouthorizad Access" })
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
        if (error) {
            return res.status(403).send({ erroe: true, message: "Unouthorized Acccess" })
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const volunteerCollection = client.db("volunteerDB").collection("volunteer");
        const donationCollection = client.db("volunteerDB").collection("donation");

        // app.get('/volunteer', async (req, res) => {
        //     const result = await volunteerCollection.find().toArray();
        //     res.send(result)
        // })

        app.get('/volunteer', async (req, res) => {
            const page = parseInt(req.query.page) || 0;
            const limit = parseInt(req.query.limit) || 10;
            const skip = page * limit;
            const result = await volunteerCollection.find().skip(skip).limit(limit).toArray();
            res.send(result)
        })
        



        app.get('/totalproducts', async (req, res) => {
            const result = await volunteerCollection.estimatedDocumentCount();
            res.send({ totalProducts: result })
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

        app.get('/volunteerpage', varifyJWT, async (req, res) => {
            if (req.decoded.email !== req.query.email) {
                return res.send({ error: 1, message: 'Forbitten Access' })
            }
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await donationCollection.find(query).toArray()
            res.send(result)

        })
        app.get('/adminpage', varifyJWT, async (req, res) => {

            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await donationCollection.find(query).toArray()
            res.send(result)

        })

        app.patch('/update/:id', async (req, res) => {
            const id = req.params.id;
            const user = req.body;
            const filter = { _id: new ObjectId(id) }
            const objects = {
                $set: {
                    status: user.status
                }
            }
            const result = await donationCollection.updateOne(filter, objects)
            res.send(result)
        })
        app.delete('/delete/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await donationCollection.deleteOne(filter);
            res.send(result)
        })

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN)
            res.send({ token })
        })

        app.post('/addnew', async (req, res) => {
            const item = req.body;
            const result = await volunteerCollection.insertOne(item)
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

app.listen(port, () => {
    console.log("port no is", port);
})