// src/services/mongoService.ts

// MongoDB Atlas Data API service
// This service handles all direct interactions with MongoDB Atlas Data API

const ATLAS_APP_ID = import.meta.env.VITE_MONGODB_APP_ID;
const ATLAS_API_KEY = import.meta.env.VITE_MONGODB_API_KEY;
const ATLAS_ENDPOINT = `https://data.mongodb-api.com/app/${ATLAS_APP_ID}/endpoint/data/v1`;
const DB_NAME = 'earlyspring';

// Flag to track if we're in development environment
const IS_DEV = import.meta.env.DEV;

// Create headers with API key
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'api-key': ATLAS_API_KEY
  };
};

// Local storage keys for mock data in dev mode
const MOCK_USERS_KEY = 'earlyspring_mock_users';
const MOCK_ALARMS_KEY = 'earlyspring_mock_alarms';

// Initialize mock data in localStorage for development
const initMockData = () => {
  if (!localStorage.getItem(MOCK_USERS_KEY)) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(MOCK_ALARMS_KEY)) {
    localStorage.setItem(MOCK_ALARMS_KEY, JSON.stringify([]));
  }
};

// Development fallback helpers
const getMockData = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    console.error('Error parsing mock data:', e);
    return [];
  }
};

const saveMockData = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize mock data in development
if (IS_DEV) {
  initMockData();
}

// Generic function to find documents in a collection
export const findDocuments = async <T>(
  collection: string,
  filter: Record<string, any> = {},
  options: {
    limit?: number;
    sort?: Record<string, 1 | -1>;
    projection?: Record<string, 1 | 0>;
  } = {}
): Promise<T[]> => {
  try {
    // Try to fetch from MongoDB Atlas
    const response = await fetch(`${ATLAS_ENDPOINT}/action/find`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        collection,
        database: DB_NAME,
        filter,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`MongoDB find failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.documents as T[];
  } catch (error) {
    console.error('Error finding documents:', error);

    // Fallback to localStorage in development mode
    if (IS_DEV) {
      console.warn('Using localStorage fallback for development');
      const mockKey = collection === 'users' ? MOCK_USERS_KEY : MOCK_ALARMS_KEY;
      const allData = getMockData(mockKey);

      // Simple filtering
      let filtered = allData;
      if (filter) {
        filtered = allData.filter((item: any) => {
          return Object.entries(filter).every(([key, value]) => {
            // Handle MongoDB ID object format
            if (key === '_id' && typeof value === 'object' && value.$oid) {
              return item._id === value.$oid;
            }
            return item[key] === value;
          });
        });
      }

      // Simple sorting
      if (options.sort) {
        const sortKey = Object.keys(options.sort)[0];
        const sortDirection = options.sort[sortKey];
        filtered.sort((a: any, b: any) => {
          if (a[sortKey] < b[sortKey]) return -1 * sortDirection;
          if (a[sortKey] > b[sortKey]) return 1 * sortDirection;
          return 0;
        });
      }

      // Simple limit
      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      return filtered as T[];
    }

    // Rethrow error for production
    throw error;
  }
};

// Find a single document in a collection
export const findOneDocument = async <T>(
  collection: string,
  filter: Record<string, any>
): Promise<T | null> => {
  try {
    // Try to fetch from MongoDB Atlas
    const response = await fetch(`${ATLAS_ENDPOINT}/action/findOne`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        collection,
        database: DB_NAME,
        filter
      })
    });

    if (!response.ok) {
      throw new Error(`MongoDB findOne failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.document as T;
  } catch (error) {
    console.error('Error finding document:', error);

    // Fallback to localStorage in development mode
    if (IS_DEV) {
      console.warn('Using localStorage fallback for development');
      const mockKey = collection === 'users' ? MOCK_USERS_KEY : MOCK_ALARMS_KEY;
      const allData = getMockData(mockKey);

      const found = allData.find((item: any) => {
        return Object.entries(filter).every(([key, value]) => {
          // Handle MongoDB ID object format
          if (key === '_id' && typeof value === 'object' && value.$oid) {
            return item._id === value.$oid;
          }
          return item[key] === value;
        });
      });

      return found as T || null;
    }

    // Rethrow error for production
    throw error;
  }
};

// Insert a single document into a collection
export const insertOneDocument = async <T>(
  collection: string,
  document: Record<string, any>
): Promise<T> => {
  try {
    // Add timestamps
    const docWithTimestamps = {
      ...document,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate a simple ID if not provided
    if (!docWithTimestamps._id) {
      docWithTimestamps._id = Math.random().toString(36).substring(2, 15) +
                             Math.random().toString(36).substring(2, 15);
    }

    // Try to insert to MongoDB Atlas
    const response = await fetch(`${ATLAS_ENDPOINT}/action/insertOne`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        collection,
        database: DB_NAME,
        document: docWithTimestamps
      })
    });

    if (!response.ok) {
      throw new Error(`MongoDB insertOne failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Return the inserted document with its ID
    return {
      ...docWithTimestamps,
      _id: result.insertedId || docWithTimestamps._id
    } as T;
  } catch (error) {
    console.error('Error inserting document:', error);

    // Fallback to localStorage in development mode
    if (IS_DEV) {
      console.warn('Using localStorage fallback for development');
      const mockKey = collection === 'users' ? MOCK_USERS_KEY : MOCK_ALARMS_KEY;
      const allData = getMockData(mockKey);

      // Generate ID if not present
      if (!document._id) {
        document._id = Math.random().toString(36).substring(2, 15) +
                        Math.random().toString(36).substring(2, 15);
      }

      // Add timestamps
      const newDoc = {
        ...document,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to mock data
      allData.push(newDoc);
      saveMockData(mockKey, allData);

      return newDoc as T;
    }

    // Rethrow error for production
    throw error;
  }
};

// Update a single document in a collection
export const updateOneDocument = async <T>(
  collection: string,
  filter: Record<string, any>,
  update: Record<string, any>
): Promise<T | null> => {
  try {
    // Add updated timestamp
    const updateWithTimestamp = {
      ...update,
      updatedAt: new Date()
    };

    // Try to update in MongoDB Atlas
    const response = await fetch(`${ATLAS_ENDPOINT}/action/updateOne`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        collection,
        database: DB_NAME,
        filter,
        update: { $set: updateWithTimestamp }
      })
    });

    if (!response.ok) {
      throw new Error(`MongoDB updateOne failed: ${response.statusText}`);
    }

    // Fetch and return the updated document
    return await findOneDocument<T>(collection, filter);
  } catch (error) {
    console.error('Error updating document:', error);

    // Fallback to localStorage in development mode
    if (IS_DEV) {
      console.warn('Using localStorage fallback for development');
      const mockKey = collection === 'users' ? MOCK_USERS_KEY : MOCK_ALARMS_KEY;
      const allData = getMockData(mockKey);

      // Find the document to update
      const index = allData.findIndex((item: any) => {
        return Object.entries(filter).every(([key, value]) => {
          // Handle MongoDB ID object format
          if (key === '_id' && typeof value === 'object' && value.$oid) {
            return item._id === value.$oid;
          }
          return item[key] === value;
        });
      });

      if (index !== -1) {
        // Update document with timestamp
        allData[index] = {
          ...allData[index],
          ...update,
          updatedAt: new Date()
        };
        saveMockData(mockKey, allData);
        return allData[index] as T;
      }

      return null;
    }

    // Rethrow error for production
    throw error;
  }
};

// Delete a single document from a collection
export const deleteOneDocument = async (
  collection: string,
  filter: Record<string, any>
): Promise<boolean> => {
  try {
    // Try to delete from MongoDB Atlas
    const response = await fetch(`${ATLAS_ENDPOINT}/action/deleteOne`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        collection,
        database: DB_NAME,
        filter
      })
    });

    if (!response.ok) {
      throw new Error(`MongoDB deleteOne failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.deletedCount === 1;
  } catch (error) {
    console.error('Error deleting document:', error);

    // Fallback to localStorage in development mode
    if (IS_DEV) {
      console.warn('Using localStorage fallback for development');
      const mockKey = collection === 'users' ? MOCK_USERS_KEY : MOCK_ALARMS_KEY;
      const allData = getMockData(mockKey);

      // Find document to delete
      const initialLength = allData.length;
      const filtered = allData.filter((item: any) => {
        return !Object.entries(filter).every(([key, value]) => {
          // Handle MongoDB ID object format
          if (key === '_id' && typeof value === 'object' && value.$oid) {
            return item._id === value.$oid;
          }
          return item[key] === value;
        });
      });

      saveMockData(mockKey, filtered);
      return filtered.length < initialLength;
    }

    // Rethrow error for production
    throw error;
  }
};
