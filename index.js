import express from 'express';
import 'dotenv/config';

const app = express();
app.use(express.json());

// --- THE ULTIMATE TEST ROUTE ---
// This route is designed to isolate the problem.
// It makes the simplest possible request to the Gemini API.
// If this fails, the problem is 100% with the API key or Google project setup.
app.get('/api/test-key', async (req, res) => {
    console.log("--- Starting /api/test-key ---");

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error("FATAL: GEMINI_API_KEY is not defined in Vercel environment variables.");
        return res.status(500).json({ 
            step: 1,
            success: false,
            error: "Server configuration error.",
            message: "The GEMINI_API_KEY is missing. Please add it to your Vercel project's environment variables." 
        });
    }

    console.log("API Key is present. Attempting to call Google AI.");

    // The most stable and documented endpoint for gemini-pro.
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
        contents: [{
            parts: [{ text: "Hello! If you see this, say 'Test successful'. Just that." }]
        }]
    };

    try {
        // We are using node-fetch which is available in Vercel's environment by default
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseBody = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error("--- GEMINI API RETURNED AN ERROR ---", responseBody);
            return res.status(apiResponse.status).json({
                step: 2,
                success: false,
                error: "Google AI API responded with an error.",
                details: responseBody
            });
        }
        
        console.log("--- GEMINI API SUCCESS ---", responseBody);
        const text = responseBody.candidates[0]?.content?.parts[0]?.text;

        res.status(200).json({
            step: 3,
            success: true,
            message: "API Key is working correctly!",
            ai_response: text
        });

    } catch (error) {
        console.error("--- CRITICAL FETCH ERROR ---", error);
        res.status(500).json({
            step: 4,
            success: false,
            error: "A critical network or parsing error occurred while contacting Google AI.",
            message: error.message
        });
    }
});


// A simple root route to confirm the server is running.
app.get('/', (req, res) => {
    res.send('Server is running. Please go to /api/test-key to test your Gemini API Key.');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
