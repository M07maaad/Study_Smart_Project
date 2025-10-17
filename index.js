import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Static Files ---
app.use(express.static('public'));

// --- API Routes ---

// Authentication (No changes)
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

// Content (No changes)
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

// --- UPDATED AI QUIZ ROUTE ---
app.post('/api/generate-quiz', async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
    }

    try {
        // FIX: Using the stable model name "gemini-1.0-pro"
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        
        const prompt = `
            You are a helpful assistant for university students. 
            Based on the following topic: "${topic}", generate exactly 5 multiple-choice questions with 4 options each to test a student's understanding.
            Provide the correct answer for each question. 
            The output must be only a valid JSON array, without any other text, comments, or markdown formatting like \`\`\`json.
            The JSON structure must be: 
            [
              { 
                "question": "The question text?", 
                "options": ["Option A", "Option B", "Option C", "Option D"], 
                "correctAnswer": "Option A" 
              }
            ]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Attempt to parse the cleaned text
        res.json(JSON.parse(text));

    } catch (error) {
        // Enhanced error logging
        console.error("--- DETAILED GEMINI ERROR ---");
        console.error(error);
        console.error("-----------------------------");
        res.status(500).json({ error: "Failed to generate quiz. There might be an issue with the AI service or API key." });
    }
});

// --- Serve Frontend ---
app.get('*', (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

