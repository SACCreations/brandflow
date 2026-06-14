import { describe, it, expect } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import {
  BrandAlreadyExistsException,
  CustomerAlreadyExistsException,
  ScheduleAlreadyPublishedException,
  CampaignBudgetExceededException,
  DuplicateKnowledgeSourceException,
  InvalidTemplateVariableException,
  ContentAlreadyApprovedException,
} from './business.exceptions';

describe('BusinessExceptions', () => {
  it('should instantiate BrandAlreadyExistsException with 409 Conflict', () => {
    const exc = new BrandAlreadyExistsException('Duplicate Brand');
    expect(exc.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exc.getResponse()).toEqual({
      message: 'Duplicate Brand',
      error: 'BrandAlreadyExistsException',
      statusCode: HttpStatus.CONFLICT,
    });
  });

  it('should instantiate CustomerAlreadyExistsException with 409 Conflict', () => {
    const exc = new CustomerAlreadyExistsException();
    expect(exc.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exc.getResponse()).toEqual({
      message: 'Customer already exists',
      error: 'CustomerAlreadyExistsException',
      statusCode: HttpStatus.CONFLICT,
    });
  });

  it('should instantiate ScheduleAlreadyPublishedException with 409 Conflict', () => {
    const exc = new ScheduleAlreadyPublishedException();
    expect(exc.getStatus()).toBe(HttpStatus.CONFLICT);
  });

  it('should instantiate CampaignBudgetExceededException with 400 BadRequest', () => {
    const exc = new CampaignBudgetExceededException();
    expect(exc.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should instantiate DuplicateKnowledgeSourceException with 409 Conflict', () => {
    const exc = new DuplicateKnowledgeSourceException();
    expect(exc.getStatus()).toBe(HttpStatus.CONFLICT);
  });

  it('should instantiate InvalidTemplateVariableException with 400 BadRequest', () => {
    const exc = new InvalidTemplateVariableException();
    expect(exc.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should instantiate ContentAlreadyApprovedException with 409 Conflict', () => {
    const exc = new ContentAlreadyApprovedException();
    expect(exc.getStatus()).toBe(HttpStatus.CONFLICT);
  });
});
