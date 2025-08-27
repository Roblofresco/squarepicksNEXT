'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '@/lib/firebase-client'
