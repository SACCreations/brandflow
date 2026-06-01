"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextSplitter = void 0;
/**
 * A robust recursive character splitter for semantic-friendly chunking.
 * Prioritizes splitting by double newlines (paragraphs), then single newlines, then sentences.
 */
class TextSplitter {
    chunkSize;
    chunkOverlap;
    constructor(chunkSize = 1000, chunkOverlap = 200) {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
    }
    split(text) {
        // 1. Structural Splitting (Markdown Headers)
        const headerPattern = /^#+ /m;
        if (headerPattern.test(text)) {
            return this.structuralSplit(text);
        }
        // 2. Fallback to Recursive Splitting
        const separators = ['\n\n', '\n', '. ', '? ', '! ', ' ', ''];
        return this.recursiveSplit(text, separators);
    }
    structuralSplit(text) {
        const lines = text.split('\n');
        const sections = [];
        let currentHeader = '';
        let currentContent = [];
        for (const line of lines) {
            if (line.startsWith('#')) {
                if (currentContent.length > 0) {
                    sections.push({ header: currentHeader, content: currentContent });
                }
                currentHeader = line;
                currentContent = [];
            }
            else {
                currentContent.push(line);
            }
        }
        if (currentContent.length > 0) {
            sections.push({ header: currentHeader, content: currentContent });
        }
        const chunks = [];
        for (const section of sections) {
            const sectionText = (section.header ? section.header + '\n' : '') + section.content.join('\n');
            if (sectionText.length <= this.chunkSize) {
                chunks.push(sectionText);
            }
            else {
                // If section is too large, use recursive split on it
                const subChunks = this.recursiveSplit(section.content.join('\n'), ['\n\n', '\n', '. ', ' ']);
                for (const sub of subChunks) {
                    chunks.push((section.header ? section.header + ' (cont.)\n' : '') + sub);
                }
            }
        }
        return chunks;
    }
    recursiveSplit(text, separators) {
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
        const finalChunks = [];
        let currentChunk = '';
        for (const split of splits) {
            const prospectiveText = currentChunk ? currentChunk + separator + split : split;
            if (prospectiveText.length <= this.chunkSize) {
                currentChunk = prospectiveText;
            }
            else {
                if (currentChunk) {
                    finalChunks.push(currentChunk);
                }
                // If the split itself is too large, recurse on it
                if (split.length > this.chunkSize) {
                    finalChunks.push(...this.recursiveSplit(split, remainingSeparators));
                    currentChunk = '';
                }
                else {
                    currentChunk = split;
                }
            }
        }
        if (currentChunk) {
            finalChunks.push(currentChunk);
        }
        return finalChunks;
    }
    hardSplit(text) {
        const chunks = [];
        for (let i = 0; i < text.length; i += this.chunkSize - this.chunkOverlap) {
            chunks.push(text.slice(i, i + this.chunkSize));
        }
        return chunks;
    }
}
exports.TextSplitter = TextSplitter;
//# sourceMappingURL=chunking.js.map