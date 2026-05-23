import { createBrandSchema } from './packages/shared/src/validators/index';

const testData = {
  name: 'Test Brand',
  slug: 'test brand', // intentional space
  tagline: 'Test',
  description: 'Test',
  industry: 'Test',
  website: 'test.com',
  contactInfo: {
    personName: 'Test',
    phoneNumber: '12345',
    email: 'test@test.com',
    officeAddress: 'Test'
  }
};

const res = createBrandSchema.safeParse(testData);
console.log(JSON.stringify(res, null, 2));
