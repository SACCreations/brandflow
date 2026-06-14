import { ConflictException, BadRequestException } from '@nestjs/common';

export class BrandAlreadyExistsException extends ConflictException {
  constructor(message = 'Brand slug already exists') {
    super(message, 'BrandAlreadyExistsException');
  }
}

export class CustomerAlreadyExistsException extends ConflictException {
  constructor(message = 'Customer already exists') {
    super(message, 'CustomerAlreadyExistsException');
  }
}

export class ScheduleAlreadyPublishedException extends ConflictException {
  constructor(message = 'Schedule is already published') {
    super(message, 'ScheduleAlreadyPublishedException');
  }
}

export class CampaignBudgetExceededException extends BadRequestException {
  constructor(message = 'Campaign budget limit exceeded') {
    super(message, 'CampaignBudgetExceededException');
  }
}

export class DuplicateKnowledgeSourceException extends ConflictException {
  constructor(message = 'Duplicate knowledge source detected') {
    super(message, 'DuplicateKnowledgeSourceException');
  }
}

export class InvalidTemplateVariableException extends BadRequestException {
  constructor(message = 'Invalid template variables provided') {
    super(message, 'InvalidTemplateVariableException');
  }
}

export class ContentAlreadyApprovedException extends ConflictException {
  constructor(message = 'Content has already been approved') {
    super(message, 'ContentAlreadyApprovedException');
  }
}
