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
app.post('/heartbeat/:id', (req, res) => {
    const id = req.params.id;
    const session = sessions[id];

    if (!session) {
        return res.status(404).json({ success: false, message: "Session not found" });
    }

    session.lastHeartbeat = Date.now();
    if (typeof req.body.currentPlayers === 'number') {
        session.currentPlayers = req.body.currentPlayers;
    }

    res.json({ success: true });
});

// Unregister a session
app.post('/unregister/:id', (req, res) => {
    const id = req.params.id;

    if (!sessions[id]) {
        return res.status(404).json({ success: false, message: "Session not found" });
    }

    delete sessions[id];
    res.json({ success: true });
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
