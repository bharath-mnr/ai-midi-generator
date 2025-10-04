//backend/src/routes/midiRoutes.js
const express = require('express');
const router = express.Router();
const midiController = require('../controllers/midiController');
const upload = require('../middleware/upload');

router.post('/midi-to-text', upload.single('midiFile'), midiController.midiToText);
router.post('/text-to-midi', midiController.textToMidi);

module.exports = router;