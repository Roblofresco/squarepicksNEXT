# Story: Lobby Filters & Sorting

## Goal
Enable filtering/sorting of boards by sport, entry fee, start time.

## Scope
- `/lobby` regular sports view

## Tasks
- UI: Add filter bar (sport multi-select, entry fee chips, date/time sort)
- State: store selected filters; persist in URL search params
- Data: adjust Firestore queries based on filters; client-side sort
- Knowledge: update lobby knowledge page

## Acceptance Criteria
- Users can filter by sport(s) and entry fee(s)
- Sorting by start time asc/desc
- Filters reflected in URL; refresh preserves state
- Performance acceptable with onSnapshot updates 