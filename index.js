require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// middleware
app.use(cors());
app.use(express.json());
const username = process.env.USER_NAME;
const password = process.env.PASSWORD;

const uri = `mongodb+srv://${username}:${password}@cluster0.klmvqmu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("Book_college").collection("users");
    const collegeCollection = client.db("Book_college").collection("colleges");
    const reviewCollection = client.db("Book_college").collection("reviews");
    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/single-user", async (req, res) => {
      const email = req.query.email;
      // console.log(email);

      try {
        const query = { email: email };

        if (!email) {
          return res.status(400).json({ error: "Email parameter is missing" });
        }
        const result = await userCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.patch("/single-user/:userId", async (req, res) => {
      const Id = req.params.userId;
      const user = req.body;
      // console.log(user, Id);

      try {
        const filter = { _id: new ObjectId(Id) };
        const existingUser = await userCollection.findOne(filter);

        if (!existingUser) {
          // User not found
          return res.status(404).json({ error: "User not found with this id" });
        }
        const options = { upsert: true };
        const updatedUser = {
          $set: {
            name: user.name,
            contact: user.contact,
          },
        };
        console.log(updatedUser);
        const result = await userCollection.updateOne(
          filter,
          updatedUser,
          options
        );

        res.send(result);
      } catch (error) {
        // Server error
        console.log({
          message: "Dog Shit",
          error,
        });
        res.status(500).json({ error: "Server error" });
      }
    });
    app.post("/admission", async (req, res) => {
      const body = req.body;
      console.log(body);
      const result = await collegeCollection.insertOne(body);
      res.send(result);
    });
    app.get("/single-admission-college/:id", async (req, res) => {
      const id = req.params.id;
      const studentId = { studentId: id };
      const result = await collegeCollection.find(studentId).toArray();
      // console.log(result);
      res.send(result);
    });
    app.post("/review", async (req, res) => {
      const {
        collegeId,
        studentId,
        collegePhoto,
        description,
        rating,
        collegeName,
      } = req.body;
      if (!collegeId || !studentId || !description || !rating || !collegeName) {
        return res.status(400).send({ message: "Incomplete review data" });
      }

      const newReview = {
        collegeId,
        studentId,
        collegePhoto,
        description,
        rating: parseInt(rating), // Make sure rating is an integer
        createdAt: new Date(),
        collegeName,
      };

      try {
        const result = await reviewCollection.insertOne(newReview);
        res.send({ insertedId: result.insertedId });
      } catch (error) {
        console.error("Error posting review:", error);
        res.status(500).send({ message: "Failed to post review" });
      }
    });

    app.get("/review", async (req, res) => {
      try {
        const allReviews = await reviewCollection.find().toArray(); // Use find() to get all reviews
        res.send(allReviews); // Send the array of reviews
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send({ message: "Failed to fetch reviews" });
      }
    });
    app.get("/colleges", async (req, res) => {
      try {
        const colleges = await collegeCollection.find().toArray(); // Use find() to get all reviews
        res.send(colleges); // Send the array of reviews
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send({ message: "Failed to fetch reviews" });
      }
    });
    app.get("/college-details/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(email);
      const query = { _id: new ObjectId(id) };
      const result = await collegeCollection.findOne(query);
      res.send(result);
    });
    app.get("/college-details-review/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(email);
      const query = { collegeId: id };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Book College is sitting on port");
});

app.listen(port, () => {
  console.log(`Book College is sitting on port ${port}`);
});
