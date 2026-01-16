import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url || !url.includes('t.me/')) {
            return NextResponse.json({ error: 'Invalid URL. Must be a t.me link.' }, { status: 400 });
        }

        // Identify if it's a raw t.me/channel/123 link or just t.me/channel
        // We assume specific post for import
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch Telegram page.' }, { status: 502 });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Strategy 1: Open Graph Tags
        let text = $('meta[property="og:description"]').attr('content') || '';
        let image = $('meta[property="og:image"]').attr('content') || '';

        // Strategy 2: Telegram Widget Message Text
        // .tgme_widget_message_text is the class for the message content in Web Preview
        const widgetText = $('.tgme_widget_message_text').text();
        if (widgetText && widgetText.length > text.length) {
            text = widgetText; // Prefer the direct widget text if it's longer/available
        }

        // Strategy 3: Widget Image
        // a.tgme_widget_message_photo_wrap -> style background-image
        if (!image) {
            const style = $('.tgme_widget_message_photo_wrap').attr('style');
            if (style) {
                const match = style.match(/url\('?(.*?)'?\)/);
                if (match) {
                    image = match[1];
                }
            }
        }

        // Cleanup text
        // Remove unwanted HTML artifacts if any leaked, though .text() usually handles it.
        // Replace <br> with newlines if we pulled raw html (cheerio .text() strips tags but keeps content).
        // Actually .text() joins children. If there were brs, they might be lost.
        // Better to use .html() and replace <br> with \n then .text()
        if (!text && $('.tgme_widget_message_text').length) {
            const rawHtml = $('.tgme_widget_message_text').html();
            if (rawHtml) {
                text = rawHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
                // Decode entities? cheerio text() handles decoding, manual replace might not.
                // simpler:
                const $text = cheerio.load(rawHtml.replace(/<br\s*\/?>/gi, '\n'));
                text = $text.text();
            }
        }

        if (!text) {
            return NextResponse.json({ error: 'Could not find message text. Channel might be private or restricted.' }, { status: 422 });
        }

        return NextResponse.json({ text, image });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
