import * as zlib from 'zlib';

/**
 * Extract text from a PPTX file buffer.
 * PPTX files are ZIP archives containing XML slides.
 * This uses a minimal ZIP parser to avoid external dependencies.
 */
export async function extractPptxText(buffer: Buffer): Promise<string> {
  const entries = parseZipEntries(buffer);
  const slideEntries = entries
    .filter(e => /^ppt\/slides\/slide\d+\.xml$/i.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const texts: string[] = [];
  for (const entry of slideEntries) {
    const xml = inflateEntry(buffer, entry);
    const matches = xml.match(/<a:t>(.*?)<\/a:t>/g) ?? [];
    const slideText = matches
      .map(m => m.replace(/<[^>]+>/g, ''))
      .filter(Boolean)
      .join(' ');
    if (slideText.trim()) {
      texts.push(slideText);
    }
  }

  return texts.join('\n\n');
}

interface ZipEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  dataOffset: number;
}

function parseZipEntries(buffer: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset < buffer.length - 4) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) break; // Local file header signature

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const uncompressedSize = buffer.readUInt32LE(offset + 22);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString('utf-8', offset + 30, offset + 30 + nameLen);
    const dataOffset = offset + 30 + nameLen + extraLen;

    entries.push({ name, compressedSize, uncompressedSize, compressionMethod, dataOffset });
    offset = dataOffset + compressedSize;
  }

  return entries;
}

function inflateEntry(buffer: Buffer, entry: ZipEntry): string {
  const data = buffer.subarray(entry.dataOffset, entry.dataOffset + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return data.toString('utf-8');
  }

  // Deflate (method 8) — use raw inflate (no header)
  const inflated = zlib.inflateRawSync(data);
  return inflated.toString('utf-8');
}
