import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getGeminiModel } from '@/lib/ai';

export const dynamic = 'force-dynamic';

let cachedStatus: {
  data: { keyPresent: boolean; model: string; ok: boolean; errorCode?: number | string };
  expiresAt: number;
} | null = null;

export async function GET() {
  if (cachedStatus && Date.now() < cachedStatus.expiresAt) {
    return NextResponse.json(cachedStatus.data);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const keyPresent = Boolean(apiKey && apiKey !== 'your_key_here');
  const model = getGeminiModel();

  if (!keyPresent) {
    const data = {
      keyPresent: false,
      model,
      ok: false,
      errorCode: 'NO_KEY',
    };
    cachedStatus = { data, expiresAt: Date.now() + 30000 };
    return NextResponse.json(data);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    console.log(`[AI Status] Testing Gemini endpoint with model="${model}"...`);
    const res = await Promise.race([
      ai.models.generateContent({
        model,
        contents: 'ping',
      }),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);

    const data = {
      keyPresent: true,
      model,
      ok: Boolean(res.text),
    };
    cachedStatus = { data, expiresAt: Date.now() + 60000 };
    return NextResponse.json(data);
  } catch (err: any) {
    const errorCode =
      err?.status || err?.statusCode || err?.code || (err?.message?.includes('404') ? 404 : 500);
    const quotaExceeded = err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED') || errorCode === 429;
    const cleanError = quotaExceeded
      ? 'Daily Free Tier quota exceeded (limit: 20 requests/day). Reached Google Gemini endpoint successfully.'
      : err?.message?.slice(0, 200) || 'API error';

    console.warn(`[AI Status] Gemini verification: status=${errorCode}, info="${cleanError}"`);

    const data = {
      keyPresent: true,
      model,
      ok: false,
      errorCode,
      errorMessage: cleanError,
    };
    cachedStatus = { data, expiresAt: Date.now() + 15000 };
    return NextResponse.json(data);
  }
}
