#!/usr/bin/env python3
"""
Simple Python script to update Firestore teams and games
Usage: python update-firestore.py
"""

import json
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
cred = credentials.Certificate('../certificates/firebase-admin-key.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

print("🔄 Starting Firestore updates...\n")

# Step 1: Enrich 31 teams
teams_data = [
    {"docId": "RDnjryTT2mkizKSm9ikl", "espnId": "33", "abbrev": "BAL"},
    {"docId": "EQIgUZ28Cf6FrITIxWy7", "espnId": "29", "abbrev": "CAR"},
    {"docId": "WOItYy5G1yRVG0fESSmF", "espnId": "17", "abbrev": "NE"},
    {"docId": "DjbPCyd97B5OqLNRGsym", "espnId": "7", "abbrev": "DEN"},
    {"docId": "NGTMc6cY1ZCdDOJx93RP", "espnId": "28", "abbrev": "WSH"},
    {"docId": "M81pkB3UYIsVdy8YyjlE", "espnId": "34", "abbrev": "HOU"},
    {"docId": "pOPmOJG8juYhDHPhABTZ", "espnId": "18", "abbrev": "NO"},
    {"docId": "KP13Gr1Pcl0v1E4beCZg", "espnId": "8", "abbrev": "DET"},
    {"docId": "kUoV2wNaHKyhoRpzBZZM", "espnId": "3", "abbrev": "CHI"},
    {"docId": "V4yqAwq5XzJFpTsTB4Fe", "espnId": "15", "abbrev": "MIA"},
    {"docId": "ABZ1RckHosMndz32YZ1e", "espnId": "11", "abbrev": "IND"},
    {"docId": "V99Z9G2U2MXSr6E85IBY", "espnId": "14", "abbrev": "LAR"},
    {"docId": "ItcC7vuurg0AxNlZylsu", "espnId": "9", "abbrev": "GB"},
    {"docId": "R2h9AzWrdhqH23x3j3NW", "espnId": "4", "abbrev": "CIN"},
    {"docId": "gVEJIamddUIZtsAPHlXS", "espnId": "27", "abbrev": "TB"},
    {"docId": "LWxconGs3OxmsVyLx8xM", "espnId": "12", "abbrev": "KC"},
    {"docId": "NY4cLLiBKYInCKqdUyeH", "espnId": "22", "abbrev": "ARI"},
    {"docId": "aLErKrB7OpP0tEsJHAvQ", "espnId": "16", "abbrev": "MIN"},
    {"docId": "apamE1NKkS8ipZLtS158", "espnId": "5", "abbrev": "CLE"},
    {"docId": "dnaR2Ckv9hDNMsP0vhh3", "espnId": "26", "abbrev": "SEA"},
    {"docId": "XlimffsRX1wQd3YFTXeH", "espnId": "10", "abbrev": "TEN"},
    {"docId": "9cPsRpvGcXcXPPY2ZcK8", "espnId": "20", "abbrev": "NYJ"},
    {"docId": "p2IVSR62MKaK2IFWX0lU", "espnId": "6", "abbrev": "DAL"},
    {"docId": "nfRohFoPZESru1p0ynXG", "espnId": "19", "abbrev": "NYG"},
    {"docId": "iz2nI7o69RLo2Upbid3N", "espnId": "30", "abbrev": "JAX"},
    {"docId": "1m0J9SlMFNkNbtubwAX8", "espnId": "21", "abbrev": "PHI"},
    {"docId": "RUIBcaJ0TNPQadLB9iu7", "espnId": "25", "abbrev": "SF"},
    {"docId": "ubbWz7RJZNUJbdGY9daA", "espnId": "1", "abbrev": "ATL"},
    {"docId": "NfejodWx0OxUQPxBwSfe", "espnId": "23", "abbrev": "PIT"},
    {"docId": "T222VgdaBavKnSNynsKY", "espnId": "24", "abbrev": "LAC"},
    {"docId": "q6PZdMtP19lVIi7UUQfr", "espnId": "2", "abbrev": "BUF"},
]

print("✏️  Enriching 31 teams...")
for team in teams_data:
    doc_ref = db.collection('teams').document(team['docId'])
    doc_ref.update({
        'externalIds': {'espn': team['espnId']},
        'abbrev': team['abbrev'],
        'sport': 'NFL'
    })
    print(f"  ✅ {team['abbrev']}")

print(f"\n✅ Enriched {len(teams_data)} teams\n")

# Step 2: Remap 13 games
games_data = [
    {"gameId": "401772634", "awayTeamId": "DjbPCyd97B5OqLNRGsym", "homeTeamId": "9cPsRpvGcXcXPPY2ZcK8"},
    {"gameId": "401772748", "awayTeamId": "apamE1NKkS8ipZLtS158", "homeTeamId": "NfejodWx0OxUQPxBwSfe"},
    {"gameId": "401772749", "awayTeamId": "RUIBcaJ0TNPQadLB9iu7", "homeTeamId": "gVEJIamddUIZtsAPHlXS"},
    {"gameId": "401772750", "awayTeamId": "T222VgdaBavKnSNynsKY", "homeTeamId": "V4yqAwq5XzJFpTsTB4Fe"},
    {"gameId": "401772751", "awayTeamId": "WOItYy5G1yRVG0fESSmF", "homeTeamId": "pOPmOJG8juYhDHPhABTZ"},
    {"gameId": "401772752", "awayTeamId": "R2h9AzWrdhqH23x3j3NW", "homeTeamId": "ItcC7vuurg0AxNlZylsu"},
    {"gameId": "401772815", "awayTeamId": "q6PZdMtP19lVIi7UUQfr", "homeTeamId": "ubbWz7RJZNUJbdGY9daA"},
    {"gameId": "401772855", "awayTeamId": "V99Z9G2U2MXSr6E85IBY", "homeTeamId": "RDnjryTT2mkizKSm9ikl"},
    {"gameId": "401772856", "awayTeamId": "NY4cLLiBKYInCKqdUyeH", "homeTeamId": "ABZ1RckHosMndz32YZ1e"},
    {"gameId": "401772857", "awayTeamId": "dnaR2Ckv9hDNMsP0vhh3", "homeTeamId": "iz2nI7o69RLo2Upbid3N"},
    {"gameId": "401772858", "awayTeamId": "p2IVSR62MKaK2IFWX0lU", "homeTeamId": "EQIgUZ28Cf6FrITIxWy7"},
    {"gameId": "401772859", "awayTeamId": "XlimffsRX1wQd3YFTXeH", "homeTeamId": "14ZKx8KbtUJUPiTtmVD0"},
    {"gameId": "401772923", "awayTeamId": "KP13Gr1Pcl0v1E4beCZg", "homeTeamId": "LWxconGs3OxmsVyLx8xM"},
]

print("🔄 Remapping 13 games...")
for game in games_data:
    game_ref = db.collection('games').document(game['gameId'])
    away_team_ref = db.collection('teams').document(game['awayTeamId'])
    home_team_ref = db.collection('teams').document(game['homeTeamId'])
    
    game_ref.update({
        'awayTeam': away_team_ref,
        'homeTeam': home_team_ref
    })
    print(f"  ✅ Game {game['gameId']}")

print(f"\n✅ Remapped {len(games_data)} games\n")

print("🎉 All updates complete!")
print("\n📋 Next steps:")
print("1. Visit: https://squarepicks.com/lobby?sport=NFL")
print("2. Verify team logos appear correctly")
print("3. Check Monday night game (BUF @ ATL)")

