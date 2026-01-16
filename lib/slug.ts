import slugify from 'slugify';
import { nanoid } from 'nanoid';

export function generateSlug(title: string): string {
    const baseSlug = slugify(title, { lower: true, strict: true });
    const shortId = nanoid(4);
    return `${baseSlug}-${shortId}`;
}
