import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// استيراد path للتعامل مع مسارات الملفات
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- الجزء السحري ---
// هذا السطر يخبر Express بأن يعرض أي ملفات ثابتة (HTML, CSS, JS)
// يطلبها المستخدم من داخل مجلد 'public'.
app.use(express.static('public'));
// --- نهاية الجزء السحري ---

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is missing.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- نقاط الـ API ---
// هذا الجزء يبقى كما هو، والـ API الآن موجود على مسار /api/courses

app.get('/api/courses', async (req, res) => {
  try {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching courses:', error.message);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// مسار احتياطي لعرض ملف index.html لأي طلب آخر
// هذا يساعد في التطبيقات أحادية الصفحة لاحقًا.
app.get('*', (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

