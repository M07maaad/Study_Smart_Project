import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Note: We are no longer using the @google/generative-ai library. We will use direct fetch.

const app = express();
app.use(cors());
app.use(express.json());

// --- Supabase Client ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// --- Static Files ---
app.use(express.static('public'));

// --- API Routes (No changes to Auth or Content) ---

app.post('/api/auth/signup', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data.user });
});

app.post('/api/auth/signin', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data.user, session: data.session });
});

app.get('/api/courses', async (req, res) => {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/materials/:courseId', async (req, res) => {
    const { courseId } = req.params;
    const { data, error } = await supabase.from('materials').select('*').eq('course_id', courseId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// --- THE DEFINITIVE, FINAL AI QUIZ ROUTE ---
app.post('/api/generate-quiz', async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error("FATAL: GEMINI_API_KEY is not defined.");
        return res.status(500).json({ error: "Server is not configured for AI features." });
    }
    
    // Using the latest stable model name and API version
    const modelName = "gemini-1.5-flash"; // More specific and stable than -latest
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `Based on the topic "${topic}", generate 5 multiple-choice questions with 4 options each. The output must be ONLY a valid JSON array of objects. Do not include any text, comments, or markdown formatting before or after the array. The JSON structure is: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "..."}]`;

    try {
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            // Adding safety settings to prevent potential blocks
            safetySettings: [
                { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
                { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
                { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
                { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
            ]
        };

        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.json();
            console.error("--- GEMINI API ERROR RESPONSE ---", errorBody);
            throw new Error(`Google AI API responded with status ${apiResponse.status}`);
        }

        const result = await apiResponse.json();
        
        const rawTextFromAI = result.candidates[0]?.content?.parts[0]?.text;
        if (!rawTextFromAI) {
            console.error("--- UNEXPECTED AI RESPONSE STRUCTURE ---", result);
            throw new Error("AI response did not contain the expected text part.");
        }

        const startIndex = rawTextFromAI.indexOf('[');
        const endIndex = rawTextFromAI.lastIndexOf(']');
        
        if (startIndex === -1 || endIndex === -1) {
            console.error("--- AI RESPONSE WITHOUT JSON ARRAY ---", rawTextFromAI);
            throw new Error("AI response did not contain a valid JSON array.");
        }
        
        const jsonString = rawTextFromAI.substring(startIndex, endIndex + 1);
        res.json(JSON.parse(jsonString));

    } catch (error) {
        console.error("--- DETAILED ERROR in /generate-quiz ---", error);
        res.status(500).json({ error: "Failed to generate quiz. A critical error was logged." });
    }
});

// --- Serve Frontend ---
app.get('*', (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

