/**
 * A robust recursive character splitter for semantic-friendly chunking.
 * Prioritizes splitting by double newlines (paragraphs), then single newlines, then sentences.
 */
export class TextSplitter {
  constructor(
    private readonly chunkSize: number = 1000,
    private readonly chunkOverlap: number = 200,
  ) {}

  split(text: string): string[] {
    const separators = ['\n\n', '\n', '. ', '? ', '! ', ' ', ''];
    return this.recursiveSplit(text, separators);
  }

  private recursiveSplit(text: string, separators: string[]): string[] {
    if (text.length <= this.chunkSize) {
      return [text];
    }

    if (separators.length === 0) {
      // Hard cut if no more separators
      return this.hardSplit(text);
    }

    const separator = separators[0] ?? '';
    const remainingSeparators = separators.slice(1);
    const splits = text.split(separator);
    
    const finalChunks: string[] = [];
    let currentChunk = '';

    for (const split of splits) {
      const prospectiveText = currentChunk ? currentChunk + separator + split : split;

      if (prospectiveText.length <= this.chunkSize) {
        currentChunk = prospectiveText;
      } else {
        if (currentChunk) {
          finalChunks.push(currentChunk);
        }
        
        // If the split itself is too large, recurse on it
        if (split.length > this.chunkSize) {
          finalChunks.push(...this.recursiveSplit(split, remainingSeparators));
          currentChunk = '';
        } else {
          currentChunk = split;
        }
      }
    }

    if (currentChunk) {
      finalChunks.push(currentChunk);
    }

    return finalChunks;
  }

  private hardSplit(text: string): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += this.chunkSize - this.chunkOverlap) {
      chunks.push(text.slice(i, i + this.chunkSize));
    }
    return chunks;
  }
}
