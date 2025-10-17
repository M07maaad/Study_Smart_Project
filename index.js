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
// تأكد من أن متغيرات البيئة SUPABASE_URL و SUPABASE_ANON_KEY معرفة في Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// --- Gemini AI Client ---
// تأكد من أن متغير البيئة GEMINI_API_KEY معرف في Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Static Files ---
// هذا السطر يخبر الخادم بتقديم الملفات الموجودة في مجلد 'public'
app.use(express.static('public'));

// --- API Routes ---

// Authentication
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

// Content
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

// --- NEW AI QUIZ ROUTE ---
app.post('/api/generate-quiz', async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `
            You are a helpful assistant for university students. 
            Based on the following topic: "${topic}", generate 5 multiple-choice questions with 4 options each to test a student's understanding.
            Provide the correct answer for each question. 
            The output must be only a valid JSON array, without any other text or markdown formatting.
            The JSON structure should be: 
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
        
        // Clean the response to ensure it's valid JSON
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        res.json(JSON.parse(cleanedText));

    } catch (error) {
        console.error("Error generating quiz:", error);
        res.status(500).json({ error: "Failed to generate quiz. Please try again." });
    }
});

// --- Serve Frontend ---
// هذا السطر يضمن أن المستخدم سيصل دائمًا إلى واجهتك الأمامية
app.get('*', (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

