// 1. استيراد الحزم الضرورية
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة من ملف .env (أو من Vercel)
dotenv.config();

// 2. تهيئة تطبيق Express
const app = express();
const port = process.env.PORT || 3000;

// 3. استخدام الـ Middleware
app.use(cors()); // السماح بالاتصال من واجهات مختلفة
app.use(express.json()); // السماح بقراءة بيانات JSON القادمة في الطلبات

// 4. تهيئة عميل Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is missing. Make sure to set them in Vercel's environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 5. نقاط الـ API (Endpoints)

// نقطة تجريبية للتأكد من أن الخادم يعمل
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Student Portal API!' });
});

// نقطة لجلب كل المواد من قاعدة البيانات
app.get('/api/courses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*');

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching courses:', error.message);
    res.status(500).json({ error: 'Failed to fetch courses', details: error.message });
  }
});

// 6. تشغيل الخادم
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

