#!/usr/bin/env python3
"""
Script to add winning squares to a game document for testing
Usage: python add-winning-squares.py
"""

import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
cred = credentials.Certificate('../certificates/firebase-admin-key.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

print("🔄 Adding winning squares to game 401772634...\n")

# Game 401772634: DEN @ NYJ Final 13-11
# homeQ1score: 6, awayQ1score: 10 → Q1 = "06"
# homeQ2score: 0, awayQ2score: 0 → Q2 = "00"
# homeQ3score: 11, awayQ3score: 10 → Q3 = "11"
# homeScore: 11, awayScore: 13 → Final = "13"

game_ref = db.collection('games').document('401772634')
game_ref.update({
    'q1WinningSquare': '06',
    'q2WinningSquare': '00',
    'q3WinningSquare': '11',
    'finalWinningSquare': '13'
})

print("✅ Successfully added winning squares to game 401772634:")
print("  - Q1: 06")
print("  - Q2: 00")
print("  - Q3: 11")
print("  - Final: 13")
print("\n🎉 Test the frontend by visiting:")
print("https://www.squarepicks.com/game/401772634?view=final")

