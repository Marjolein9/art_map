# World Map Geography Game

An interactive geography game where you test your knowledge of world countries. Built with Node.js/Express backend and React frontend using react-simple-maps.

## Project Structure

```
art_map/
├── backend/           # Node.js/Express API server
│   ├── src/
│   │   ├── server.js  # Main server file
│   │   ├── data/
│   │   │   └── countries.js  # Country data with borders
│   │   ├── routes/    # API routes
│   │   └── controllers/ # Route controllers
│   ├── package.json
│   └── .env.example
└── frontend/          # React application
    ├── src/
    │   ├── App.js     # Main game logic
    │   └── components/
    │       ├── WorldMap.js      # Interactive map component
    │       └── GameControls.js  # Game UI controls
    ├── public/
    └── package.json
```

## Game Features

### How to Play
1. The game randomly selects a country for you to find
2. Click on the correct country on the world map
3. Use the hint button to see the target country and its neighboring countries highlighted
4. Track your score and attempts as you play

### Scoring System
- **Correct answer without hint:** 10 points
- **Correct answer with hint:** 5 points
- Game automatically advances to the next country after a correct answer

### Hint System
- Click "Show Hint" to highlight the target country (green) and all its neighboring countries (yellow)
- Can only use hint once per country
- Using a hint reduces the points earned for that country

### Technologies Used
- **Frontend:**
  - React with Hooks
  - react-simple-maps (D3-based mapping library)
  - d3-geo for map projections
  - World Atlas TopoJSON data

- **Backend:**
  - Node.js
  - Express.js
  - Country data with 70+ countries and their borders
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd art_map
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```
PORT=5000
NODE_ENV=development
```

Start the backend server:

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### 3. Frontend Setup

In a new terminal, navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Start the React development server:

```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Game API Routes

- `GET /api` - Welcome message
- `GET /api/health` - Health check endpoint
- `GET /api/game/random-country` - Get a random country for the game
- `GET /api/game/countries` - Get all countries data
- `POST /api/game/check-answer` - Check if selected country is correct
- `GET /api/game/country-neighbors/:iso` - Get country and its neighbors for hints

## Development

### Backend

The backend uses Express.js with the following middleware:
- `cors` - Enable CORS for frontend communication
- `express.json()` - Parse JSON request bodies
- `dotenv` - Environment variable management

To add new routes:
1. Create route files in `backend/src/routes/`
2. Create controllers in `backend/src/controllers/`
3. Import and use them in `server.js`

### Frontend

The frontend uses:
- **WorldMap component:** Renders the interactive map with click detection and highlighting
- **GameControls component:** Manages game UI (score, hints, new game)
- **App.js:** Main game logic and state management

Key features:
- Interactive country selection with hover effects
- Color-coded highlighting (green = target, yellow = neighbors, blue = hover)
- Responsive design with mobile support
- Automatic game progression

## Running Both Servers

You need to run both the backend and frontend servers simultaneously:

1. Terminal 1 - Backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Terminal 2 - Frontend:
   ```bash
   cd frontend
   npm start
   ```

## Building for Production

### Backend

The backend runs directly with Node.js:

```bash
cd backend
npm start
```

### Frontend

Build the React app for production:

```bash
cd frontend
npm run build
```

The optimized production build will be in the `frontend/build` directory.

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL (optional, defaults to http://localhost:5000)

## Game Data

The game includes 70+ countries with their ISO codes and neighboring countries. Countries are defined in [backend/src/data/countries.js](backend/src/data/countries.js).

To add more countries:
1. Add the country data with ISO code and neighbors array
2. Ensure ISO codes match the World Atlas TopoJSON data
3. Restart the backend server

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure:
- The backend server is running
- CORS is enabled in `backend/src/server.js`
- The frontend is making requests to the correct backend URL

### Port Already in Use
If port 5000 or 3000 is already in use:
- Change the backend port in `.env`
- Update the API URL in [frontend/src/App.js](frontend/src/App.js) accordingly

### Map Not Loading
If the map doesn't appear:
- Check browser console for errors
- Ensure the World Atlas CDN is accessible
- Check that react-simple-maps is properly installed
- Try clearing browser cache

### Countries Not Clickable
- Ensure the backend server is running
- Check that the country ISO codes match between backend data and World Atlas
- Some small territories may not be clickable due to map resolution

## Future Enhancements

- Add difficulty levels (continents, regions)
- Implement leaderboard with database
- Add timed challenges
- Include capital cities mode
- Add multiplayer support
- Track user statistics and progress
- Add more detailed country information
- Implement streak tracking
- Add sound effects and animations

## License

ISC
