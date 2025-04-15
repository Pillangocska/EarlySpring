// src/services/mongoService.ts

// This is a browser-compatible MongoDB service that uses fetch API
// to communicate with a simple backend server that connects to MongoDB

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const DB_NAME = import.meta.env.VITE_MONGO_DB_NAME || 'earlyspring';

// Helper function to make API requests
const makeRequest = async (endpoint: string, method: string, body?: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error);
    throw error;
  }
};

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
    const result = await makeRequest('find', 'POST', {
      collection,
      database: DB_NAME,
      filter,
      options
    });

    return result.documents as T[];
  } catch (error) {
    console.error('Error finding documents:', error);
    throw error;
  }
};

// Find a single document in a collection
export const findOneDocument = async <T>(
  collection: string,
  filter: Record<string, any>
): Promise<T | null> => {
  try {
    const result = await makeRequest('findOne', 'POST', {
      collection,
      database: DB_NAME,
      filter
    });

    return result.document as T;
  } catch (error) {
    console.error('Error finding document:', error);
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

    const result = await makeRequest('insertOne', 'POST', {
      collection,
      database: DB_NAME,
      document: docWithTimestamps
    });

    return result.document as T;
  } catch (error) {
    console.error('Error inserting document:', error);
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

    const result = await makeRequest('updateOne', 'POST', {
      collection,
      database: DB_NAME,
      filter,
      update: updateWithTimestamp
    });

    return result.document as T;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Delete a single document from a collection
export const deleteOneDocument = async (
  collection: string,
  filter: Record<string, any>
): Promise<boolean> => {
  try {
    const result = await makeRequest('deleteOne', 'POST', {
      collection,
      database: DB_NAME,
      filter
    });

    return result.success === true;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};
