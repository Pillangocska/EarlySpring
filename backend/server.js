// server.js
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS setup to allow requests from your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));

app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'earlyspring';
let client = null;

// Connect to MongoDB
async function connectToMongoDB() {
  if (client) return client;

  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Get database collection
async function getCollection(dbName, collectionName) {
  const mongoClient = await connectToMongoDB();
  const db = mongoClient.db(dbName);
  return db.collection(collectionName);
}

// Process filter to handle ObjectIds
function processFilter(filter) {
  const processedFilter = { ...filter };

  // Convert _id string to ObjectId if needed
  if (processedFilter._id && typeof processedFilter._id === 'string') {
    try {
      processedFilter._id = new ObjectId(processedFilter._id);
    } catch (error) {
      // Keep original if not a valid ObjectId
    }
  }

  // Handle MongoDB ID object format
  if (processedFilter._id && typeof processedFilter._id === 'object' && processedFilter._id.$oid) {
    try {
      processedFilter._id = new ObjectId(processedFilter._id.$oid);
    } catch (error) {
      // Keep original if not a valid ObjectId
    }
  }

  return processedFilter;
}

// Find documents endpoint
app.post('/api/find', async (req, res) => {
  try {
    const { collection, database, filter, options } = req.body;

    const mongoCollection = await getCollection(database, collection);
    const processedFilter = processFilter(filter || {});

    let query = mongoCollection.find(processedFilter);

    if (options?.sort) {
      query = query.sort(options.sort);
    }

    if (options?.projection) {
      query = query.project(options.projection);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const documents = await query.toArray();
    res.json({ documents });
  } catch (error) {
    console.error('Error finding documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find one document endpoint
app.post('/api/findOne', async (req, res) => {
  try {
    const { collection, database, filter } = req.body;

    const mongoCollection = await getCollection(database, collection);
    const processedFilter = processFilter(filter || {});

    const document = await mongoCollection.findOne(processedFilter);
    res.json({ document });
  } catch (error) {
    console.error('Error finding document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Insert one document endpoint
app.post('/api/insertOne', async (req, res) => {
  try {
    const { collection, database, document } = req.body;

    const mongoCollection = await getCollection(database, collection);

    const result = await mongoCollection.insertOne(document);
    res.json({
      document: {
        ...document,
        _id: result.insertedId
      }
    });
  } catch (error) {
    console.error('Error inserting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update one document endpoint
app.post('/api/updateOne', async (req, res) => {
  try {
    const { collection, database, filter, update } = req.body;

    const mongoCollection = await getCollection(database, collection);
    const processedFilter = processFilter(filter || {});

    await mongoCollection.updateOne(
      processedFilter,
      { $set: update }
    );

    // Get updated document
    const updatedDocument = await mongoCollection.findOne(processedFilter);
    res.json({ document: updatedDocument });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete one document endpoint
app.post('/api/deleteOne', async (req, res) => {
  try {
    const { collection, database, filter } = req.body;

    const mongoCollection = await getCollection(database, collection);
    const processedFilter = processFilter(filter || {});

    const result = await mongoCollection.deleteOne(processedFilter);
    res.json({
      success: result.deletedCount === 1,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});
