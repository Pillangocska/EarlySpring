// src/services/userService.ts

import { User } from '../types';
import { findOneDocument, insertOneDocument, updateOneDocument } from './mongoService';

const USERS_COLLECTION = 'users';

// Get user by Google ID
export const getUser = async (googleId: string): Promise<User | null> => {
  return await findOneDocument<User>(USERS_COLLECTION, { googleId });
};

// Get user by MongoDB ID
export const getUserById = async (id: string): Promise<User | null> => {
  return await findOneDocument<User>(USERS_COLLECTION, { _id: { $oid: id } });
};

// Create a new user
export const createUser = async (userData: User): Promise<User> => {
  // Set default values for new users
  const newUser: User = {
    ...userData,
    plantHealth: 100,
    plantLevel: 1
  };

  return await insertOneDocument<User>(USERS_COLLECTION, newUser);
};

// Update user data
export const updateUser = async (userId: string, userData: Partial<User>): Promise<User | null> => {
  return await updateOneDocument<User>(
    USERS_COLLECTION,
    { _id: { $oid: userId } },
    userData
  );
};

// Update plant health
export const updatePlantHealth = async (
  userId: string,
  healthChange: number
): Promise<User | null> => {
  // First get current user data
  const user = await getUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate new health value
  let newHealth = (user.plantHealth || 100) + healthChange;

  // Clamp health between 0 and 100
  newHealth = Math.max(0, Math.min(100, newHealth));

  // Calculate plant level (1-5) based on health
  // Level 1: 0-20, Level 2: 21-40, Level 3: 41-60, Level 4: 61-80, Level 5: 81-100
  const newLevel = Math.ceil(newHealth / 20);

  // Update the user
  return await updateOneDocument<User>(
    USERS_COLLECTION,
    { _id: { $oid: userId } },
    {
      plantHealth: newHealth,
      plantLevel: newLevel
    }
  );
};
