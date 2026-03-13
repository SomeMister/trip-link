import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as cheerio from 'cheerio';

// Strict regex: only allow https://t.me/<channel>/<messageId>
const TELEGRAM_URL_REGEX = /^https:\/\/(t\.me|telegram\.me)\/[a-zA-Z0-9_]+\/\d+$/;

export async function POST(request: Request) {
    try {
        // Fix #2: Auth check — only authenticated users can use this endpoint
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please log in.' },
                { status: 401 }
            );
        }

        const { url } = await request.json();

        // Fix #2: Strict URL validation (not just includes('t.me/'))
        if (!url || !TELEGRAM_URL_REGEX.test(url)) {
            return NextResponse.json(
                { error: 'Invalid URL. Must be a Telegram post link like https://t.me/channel/123' },
                { status: 400 }
            );
        }

        // Fix #2: Fetch with AbortController timeout (10 seconds)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        let response: Response;
        try {
            response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            });
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                return NextResponse.json(
                    { error: 'Request timed out while fetching Telegram page.' },
                    { status: 504 }
                );
            }
            throw err;
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch Telegram page.' },
                { status: 502 }
            );
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Strategy 1: Open Graph Tags
        let text = $('meta[property="og:description"]').attr('content') || '';
        let image = $('meta[property="og:image"]').attr('content') || '';

        // Strategy 2: Telegram Widget Message Text
        const widgetText = $('.tgme_widget_message_text').text();
        if (widgetText && widgetText.length > text.length) {
            text = widgetText;
        }

        // Strategy 3: Widget Image
        if (!image) {
            const style = $('.tgme_widget_message_photo_wrap').attr('style');
            if (style) {
                const match = style.match(/url\('?(.*?)'?\)/);
                if (match) {
                    image = match[1];
                }
            }
        }

        // Fallback: extract text from raw HTML (preserving line breaks)
        if (!text && $('.tgme_widget_message_text').length) {
            const rawHtml = $('.tgme_widget_message_text').html();
            if (rawHtml) {
                const $text = cheerio.load(rawHtml.replace(/<br\s*\/?>/gi, '\n'));
                text = $text.text();
            }
        }

        if (!text) {
            return NextResponse.json(
                { error: 'Could not find message text. Channel might be private or restricted.' },
                { status: 422 }
            );
        }

        return NextResponse.json({ text, image });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
