import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is missing.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- NEW AUTHENTICATION API ENDPOINTS ---

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json({ user: data.user });
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ session: data.session, user: data.user });
});


// --- DATA API ENDPOINTS ---

app.get('/api/courses', async (req, res) => {
  try {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/materials/:courseId', async (req, res) => {
  const { courseId } = req.params;
  try {
    const { data, error } = await supabase.from('materials').select('*').eq('course_id', courseId);
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

