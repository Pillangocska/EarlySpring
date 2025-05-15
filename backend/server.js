// server.js
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS setup to allow requests from your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));

app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://host.docker.internal:27017';
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

// ============ TTS PROXY ENDPOINTS ============

// Available TTS models
const TTS_MODELS = {
  // Basic MMS-TTS model (confirmed working)
  'mms-tts': {
    name: 'MMS-TTS Default',
    process: async (text) => {
      console.log('Using MMS-TTS model');

      const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
      if (!HUGGINGFACE_API_KEY) {
        throw new Error('HuggingFace API key not configured');
      }

      const apiUrl = 'https://api-inference.huggingface.co/models/facebook/mms-tts-eng';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text })
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.statusText}`);
      }

      return {
        buffer: await response.buffer(),
        contentType: 'audio/mpeg'
      };
    }
  },

  // VITS female voice model (confirmed working)
  'vits-female': {
    name: 'VITS Female Voice',
    process: async (text) => {
      console.log('Using VITS Female model');

      const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
      if (!HUGGINGFACE_API_KEY) {
        throw new Error('HuggingFace API key not configured');
      }

      const apiUrl = 'https://api-inference.huggingface.co/models/espnet/kan-bayashi_ljspeech_vits';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text })
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.statusText}`);
      }

      return {
        buffer: await response.buffer(),
        contentType: 'audio/mpeg'
      };
    }
  }
};

// Set the model you want to use here
const CURRENT_TTS_MODEL = 'vits-female';

// Proxy endpoint for TTS API
app.post('/api/tts-proxy', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text input is required' });
    }

    // Get the selected model
    const modelConfig = TTS_MODELS[CURRENT_TTS_MODEL] || TTS_MODELS['vits-female'];

    console.log(`Using TTS model: ${modelConfig.name} for text: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);

    try {
      // Process the text with the selected model
      const result = await modelConfig.process(text);

      if (!result.buffer || result.buffer.length === 0) {
        throw new Error('Empty audio response received');
      }

      // Set appropriate headers
      res.set({
        'Content-Type': result.contentType,
        'Content-Length': result.buffer.length
      });

      // Send the audio data
      res.send(result.buffer);
    } catch (modelError) {
      console.error(`Error with ${modelConfig.name}:`, modelError);

      // Try fallback if the current model failed
      if (CURRENT_TTS_MODEL !== 'vits-female') {
        console.log('Falling back to VITS female voice...');
        try {
          const fallbackResult = await TTS_MODELS['vits-female'].process(text);

          res.set({
            'Content-Type': fallbackResult.contentType,
            'Content-Length': fallbackResult.buffer.length
          });

          return res.send(fallbackResult.buffer);
        } catch (fallbackError) {
          console.error('Fallback to VITS failed:', fallbackError);
          throw modelError; // Throw the original error
        }
      } else {
        throw modelError;
      }
    }

  } catch (error) {
    console.error('TTS proxy error:', error);
    res.status(500).json({ error: 'TTS proxy error: ' + error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`TTS proxy available at http://localhost:${PORT}/api/tts-proxy`);
  console.log(`Using TTS model: ${TTS_MODELS[CURRENT_TTS_MODEL].name}`);
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
