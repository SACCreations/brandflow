/**
 * A robust recursive character splitter for semantic-friendly chunking.
 * Prioritizes splitting by double newlines (paragraphs), then single newlines, then sentences.
 */
export declare class TextSplitter {
    private readonly chunkSize;
    private readonly chunkOverlap;
    constructor(chunkSize?: number, chunkOverlap?: number);
    split(text: string): string[];
    private structuralSplit;
    private recursiveSplit;
    private hardSplit;
}
//# sourceMappingURL=chunking.d.ts.map