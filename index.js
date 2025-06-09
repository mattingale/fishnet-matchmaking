const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // Generate unique session IDs

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let sessions = {};

// Register a new session
app.post('/register', (req, res) => {
    const { name, ip, port, maxPlayers } = req.body;
    const id = uuidv4();

    sessions[id] = {
        id,
        name,
        ip,
        port,
        maxPlayers,
        currentPlayers: 1,
        lastHeartbeat: Date.now(),
    };

    res.json({ success: true, id });
});

// Heartbeat to keep session alive and update player count
app.post('/heartbeat', (req, res) => {
    const { id, currentPlayers } = req.body;

    if (sessions[id]) {
        sessions[id].lastHeartbeat = Date.now();
        sessions[id].currentPlayers = currentPlayers || sessions[id].currentPlayers;
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: "Session not found" });
    }
});

// Unregister a session
app.post('/unregister', (req, res) => {
    const { id } = req.body;

    if (sessions[id]) {
        delete sessions[id];
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: "Session not found" });
    }
});

// Fetch all active sessions (with 15-second timeout)
app.get('/sessions', (req, res) => {
    const now = Date.now();
    const activeSessions = Object.values(sessions).filter(session => (now - session.lastHeartbeat) < 15000);
    res.json(activeSessions);
});

app.listen(port, () => {
    console.log(`Matchmaker server listening on port ${port}`);
});
