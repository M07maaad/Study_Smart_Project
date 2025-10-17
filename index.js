import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// --- Supabase Client ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// --- Gemini AI Client ---
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not defined.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// --- FINAL WORKING AI QUIZ ROUTE ---
app.post('/api/generate-quiz', async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
    }

    try {
        // THE FIX: Using the correct, stable model name "gemini-pro"
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `Based on the topic "${topic}", generate 5 multiple-choice questions with 4 options each. The output must be ONLY a valid JSON array of objects. Do not include any text before or after the array. The JSON structure is: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "..."}]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        const rawTextFromAI = response.text();
        
        const startIndex = rawTextFromAI.indexOf('[');
        const endIndex = raw-TextFromAI.lastIndexOf(']');
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error("AI response did not contain a valid JSON array.");
        }
        
        const jsonString = rawTextFromAI.substring(startIndex, endIndex + 1);
        res.json(JSON.parse(jsonString));

    } catch (error) {
        console.error("--- GEMINI ERROR ---", error);
        res.status(500).json({ error: "Failed to generate quiz. A detailed error was logged." });
    }
});

// --- Serve Frontend ---
app.get('*', (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

