import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FontDetectionService {
  private readonly logger = new Logger(FontDetectionService.name);

  async detectFonts(html: string): Promise<any> {
    this.logger.log('Detecting fonts from CSS and HTML');
    
    const fontFaces = [...html.matchAll(/@font-face\s*{([^}]+)}/gi)];
    const detectedFontFamilies = [];
    
    for (const match of fontFaces) {
      const familyMatch = match[1]?.match(/font-family:\s*["']?([^"';]+)["']?/i);
      if (familyMatch && familyMatch[1]) {
        detectedFontFamilies.push(familyMatch[1].trim());
      }
    }
    
    const googleFonts = [...html.matchAll(/fonts\.googleapis\.com\/css2\?family=([^&:]+)/gi)];
    for (const match of googleFonts) {
      if (match[1]) {
        detectedFontFamilies.push(match[1].replace(/\+/g, ' ').split(':')[0]);
      }
    }
    
    return {
      extractedFonts: Array.from(new Set(detectedFontFamilies.filter(Boolean))),
      fontFilesDetected: fontFaces.length > 0
    };
  }
}
