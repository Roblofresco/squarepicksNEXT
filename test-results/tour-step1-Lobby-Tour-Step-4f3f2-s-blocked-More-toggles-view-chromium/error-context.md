# Page snapshot

```yaml
- alert
- img "SquarePicks Logo"
- main:
  - button "COUNTDOWN Starting Soon"
  - button "More"
  - img "Chicago Bears logo"
  - text: Chicago Bears Bears -
  - img "Indianapolis Colts logo"
  - text: "Indianapolis Colts Colts Choose Your Pick 0-99:"
  - textbox "##"
  - button "ENTER" [disabled]
  - text: 00 01 02 03 04 05 06 07 08 09 10 11 12 X 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 X 39 40 41 42 43 X 45 46 47 48 49 50 51 X 53 54 X 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80 81 82 83 84 85 86 87 88 89 90 91 92 93 94 95 96 97 98 99
  - paragraph: Free weekly entry. Numbers assigned at game time.
- navigation:
  - link "My Boards":
    - /url: /my-boards
    - img
  - link "Lobby":
    - /url: /lobby
    - img
  - link "Profile":
    - /url: /profile
    - img
- dialog "Choose Your View":
  - button "Close": ×
  - banner: Choose Your View
  - text: Switch between Sweepstakes and Sports.
  - contentinfo:
    - button "← Previous" [disabled]
    - button "Done"
- img
```