# Clocking System

## Overview

This project is a clocking system that allows users to clock in and out with their geolocation data. The system saves the following information to Firestore:
- `latitude`
- `longitude`
- `location` (a string combining latitude and longitude)
- `locationName` (nearest town)
- `timestamp`
- `type` (either 'CLOCKED IN' or 'CLOCKED OUT')
- `userId`

## Components

### Dashboard

The `Dashboard` component handles the clocking logic. It fetches the user's geolocation, reverse geocodes it to get the nearest town, and saves the clocking data to Firestore.

### ClockInButton

The `ClockInButton` component triggers the clocking action. The actual clocking logic is handled in the `Dashboard` component to avoid duplication and confusion.

### ClockInHistory

The `ClockInHistory` component displays the recent clocking data for the user.

## Utilities

### reverseGeocode

The `reverseGeocode` function takes latitude and longitude as input and returns the nearest town using the OpenStreetMap Nominatim API.

## How to Use

1. Ensure you have the necessary Firebase configuration in `firebase.js`.
2. Ensure your Firestore rules allow authenticated users to write to the `clockIns` collection.
3. Use the `ClockInButton` component to trigger clocking actions.
4. Use the `ClockInHistory` component to display recent clocking data.

## Troubleshooting

- Ensure the browser has permission to access geolocation.
- Check the console for any errors that might indicate why the data is not being saved correctly.
- Ensure your Firestore rules allow writing to the `clockIns` collection.

## Future Updates

- Ensure any changes to the clocking logic are made in the `Dashboard` component to avoid duplication.
- Update the `reverseGeocode` function if a more accurate geocoding service is required.

## Contact

For any issues or questions, please contact the project maintainer.
