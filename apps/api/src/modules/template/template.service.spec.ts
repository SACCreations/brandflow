import { describe, it, expect } from 'vitest';
import { TemplateService } from './template.service';
import { BadRequestException } from '@nestjs/common';

describe('TemplateService Parsing and Safety', () => {
  const service = new TemplateService();

  describe('validateAndExtractPlaceholders', () => {
    it('should extract single placeholder', () => {
      const body = 'Hello {{name}}, welcome!';
      const placeholders = service.validateAndExtractPlaceholders(body);
      expect(placeholders).toEqual(['name']);
    });

    it('should extract multiple placeholders without duplicates', () => {
      const body = 'Hello {{name}}, welcome to {{company}}! Please contact {{name}}.';
      const placeholders = service.validateAndExtractPlaceholders(body);
      expect(placeholders).toEqual(['name', 'company']);
    });

    it('should throw BadRequestException on unbalanced curly braces', () => {
      const body = 'Hello {{name, welcome!';
      expect(() => service.validateAndExtractPlaceholders(body)).toThrow(BadRequestException);
      expect(() => service.validateAndExtractPlaceholders(body)).toThrow(
        'Unbalanced double curly braces {{ }} in template body.'
      );
    });

    it('should throw BadRequestException on empty placeholder', () => {
      const body = 'Hello {{  }}, welcome!';
      expect(() => service.validateAndExtractPlaceholders(body)).toThrow(BadRequestException);
      expect(() => service.validateAndExtractPlaceholders(body)).toThrow(
        'Empty placeholder found in template body.'
      );
    });

    it('should throw BadRequestException on invalid placeholder characters', () => {
      const body = 'Hello {{first-name}}, welcome!';
      expect(() => service.validateAndExtractPlaceholders(body)).toThrow(BadRequestException);
      expect(() => service.validateAndExtractPlaceholders(body)).toThrow(
        'Invalid placeholder name "first-name".'
      );
    });
  });

  describe('safeRender', () => {
    it('should replace placeholder values successfully', () => {
      const body = 'Hello {{name}}, welcome to {{company}}!';
      const variables = { name: 'Alice', company: 'Google' };
      const rendered = service.safeRender(body, variables);
      expect(rendered).toBe('Hello Alice, welcome to Google!');
    });

    it('should degrade gracefully on missing placeholder variables', () => {
      const body = 'Hello {{name}}, welcome to {{company}}!';
      const variables = { name: 'Alice' };
      const rendered = service.safeRender(body, variables);
      expect(rendered).toBe('Hello Alice, welcome to {{company}}!');
    });
  });
});
