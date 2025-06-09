const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const sessions = new Map(); // key: id, value: session object
const HEARTBEAT_TIMEOUT = 30 * 1000; // 30 seconds

// Register a session
app.post('/register', (req, res) => {
    const id = uuidv4();
    const now = Date.now();
    const session = {
        id,
        name: req.body.name || 'Unnamed Session',
        ip: req.body.ip || req.ip,
        port: req.body.port || 7777,
        maxPlayers: req.body.maxPlayers || 10,
        currentPlayers: req.body.currentPlayers || 0,
        lastHeartbeat: now
    };

    sessions.set(id, session);
    res.json({ id });
});

// Unregister a session manually
app.delete('/unregister/:id', (req, res) => {
    const id = req.params.id;
    if (sessions.has(id)) {
        sessions.delete(id);
        return res.status(200).send('Session unregistered');
    } else {
        return res.status(404).send('Session not found');
    }
});

// Heartbeat to keep session alive + optionally update player count
app.post('/heartbeat/:id', (req, res) => {
    const id = req.params.id;
    const session = sessions.get(id);

    if (session) {
        session.lastHeartbeat = Date.now();
        if (typeof req.body.currentPlayers === 'number') {
            session.currentPlayers = req.body.currentPlayers;
        }
        sessions.set(id, session);
        return res.status(200).send('Heartbeat received');
    } else {
        return res.status(404).send('Session not found');
    }
});

// Get all active sessions (filtering out dead ones)
app.get('/sessions', (req, res) => {
    const now = Date.now();
    const activeSessions = [];

    for (const [id, session] of sessions.entries()) {
        if (now - session.lastHeartbeat <= HEARTBEAT_TIMEOUT) {
            activeSessions.push(session);
        } else {
            sessions.delete(id); // prune stale
        }
    }

    res.json(activeSessions);
});

app.listen(port, () => {
    console.log(`🎮 Matchmaker backend listening on http://localhost:${port}`);
});
