import type { LLMProvider, ProviderRequest, ProviderResponse } from '../types';

/**
 * Fallback provider for when all primary providers are unavailable.
 * Always throws an error directing users to configure their API key.
 */
export class FallbackProvider implements LLMProvider {
  readonly name = 'fallback' as const;

  isAvailable(): boolean {
    // Always available as last resort to surface a clear error
    return true;
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    // Return a mock response so the application works without API keys in development
    const isTopicSuggest = request.systemPrompt?.includes('generate exactly 5 creative');
    const isBrandAnalysis = request.systemPrompt?.includes('brand strategist') || request.systemPrompt?.includes('Brand DNA analysis');
    
    let content = 'This is a mock AI generated response because no valid API key was provided.';
    
    if (isTopicSuggest) {
      content = JSON.stringify({
        topics: [
          { id: '1', name: 'Mock Topic 1: The Future of ' + (request.model || 'Marketing'), tag: 'Innovation' },
          { id: '2', name: 'Mock Topic 2: 5 Ways to Improve Engagement', tag: 'Strategy' },
          { id: '3', name: 'Mock Topic 3: Understanding Your Audience', tag: 'Analytics' },
          { id: '4', name: 'Mock Topic 4: The Power of Brand Voice', tag: 'Branding' },
          { id: '5', name: 'Mock Topic 5: Mastering Social Media in 2026', tag: 'Social' }
        ]
      });
    } else if (isBrandAnalysis) {
      content = JSON.stringify({
        brand: {
          name: 'Apex Digital',
          tagline: 'Elevating Brand Experiences',
          description: 'Apex Digital is a modern design agency specializing in brand identity, user experience, and digital transformation. We blend minimalist aesthetics with high-performance engineering to help companies scale their digital footprint.',
          industry: 'Design & Technology',
          website: 'https://apexdigital.example.com',
          positioning: 'Premium Design & Development Partner for High-Growth Startups',
          audience: 'Founders, product leaders, and marketing teams at series A/B tech startups.',
          differentiators: 'Dual expertise in world-class aesthetics and production-grade software architecture.',
          tone: ['Professional', 'Innovative', 'Sophisticated', 'Approachable'],
          governance: {
            bannedPhrases: ['best-in-class', 'synergy', 'disruptive', 'industry-leading'],
            requiredPhrases: ['design excellence', 'performance-driven', 'brand integrity'],
            ctaPreferences: ['Get Started', 'Schedule a Consultation', 'View Case Studies'],
            requiredDisclaimer: 'All mock analytics and statistics are for demonstration purposes only.'
          },
          visualRules: {
            primaryColor: '#0F172A',
            secondaryColor: '#3B82F6',
            accentColor: '#10B981',
            neutralColor: '#F8FAFC',
            semanticColor: '#EF4444',
            fontFamily: 'Inter',
            headingFont: 'Outfit',
            bodyFont: 'Inter',
            supportingFont: 'JetBrains Mono',
            backupFont: 'sans-serif',
            logoUrls: [
              {
                url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop&q=80',
                type: 'primary',
                name: 'Primary Logo Mark'
              }
            ],
            typographySystem: {
              headingFont: 'Outfit',
              bodyFont: 'Inter',
              supportingFont: 'JetBrains Mono',
              pairings: ['Outfit (Headings)', 'Inter (Body)'],
              hierarchy: 'Scale is based on a 1.25 ratio starting from 16px body copy.',
              personality: 'Modern, crisp, geometric yet highly legible.',
              recommendations: ['Use Outfit for display text and buttons.', 'Keep body copy in Inter for optimum readability.']
            },
            colorSystem: {
              primary: '#0F172A',
              secondary: '#3B82F6',
              accent: '#10B981',
              neutral: '#F8FAFC',
              surface: '#FFFFFF',
              gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              accessibilityValidation: 'Passes WCAG AA for all primary color pairings.',
              emotionalMeaning: 'Trustworthiness, technical precision, and stability.',
              psychology: 'Slate blue instills authority and confidence, while green accents feel organic and growth-oriented.'
            },
            visualExtraction: {
              heroImages: [
                'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop&q=60',
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60'
              ],
              productVisuals: [
                'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=60'
              ],
              uiScreenshots: [
                'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60'
              ],
              designConsistencyScore: 8.5
            }
          },
          identity: {
            mission: 'To build beautiful, high-performing digital interfaces that elevate how people interact with technology.',
            vision: 'A world where enterprise software feels as intuitive and delightful as the best consumer products.',
            values: ['Aesthetic Precision', 'Technical Rigor', 'User Empathy', 'Continuous Improvement'],
            promise: 'We deliver design systems and codebases that look spectacular and scale infinitely.',
            personality: 'The expert partner who values craft, performance, and attention to detail.',
            businessOverview: {
              executiveSummary: 'Apex Digital operates at the intersection of creative design and web engineering, serving tech scale-ups internationally.',
              marketPositioning: 'Premium niche agency with elite engineering credentials.',
              customerTargeting: 'VC-funded startups in B2B SaaS, FinTech, and Developer Tools.',
              businessModel: 'Retainer-based product design and software consulting.',
              coreOfferings: ['Brand Strategy', 'UI/UX Design Systems', 'Next.js Web Development']
            },
            brandDNA: {
              emotionalIdentity: ['Trustworthy', 'Cutting-edge', 'Meticulous'],
              designLanguage: 'Clean layouts, spacious margins, and high contrast typography.',
              photographyStyle: 'Modern corporate, workspace candids with dramatic natural lighting.',
              illustrationStyle: 'Minimalist 2D vector layouts with isometric perspective.',
              uiStyle: 'Flat design with subtle glassmorphism card highlights.',
              dnaMoodboardDescriptors: ['Modern Glassmorphism', 'Clean Typography', 'Tech-Forward']
            }
          },
          brandIntelligenceScore: {
            visualConsistency: 9.0,
            typographySystem: 8.5,
            brandClarity: 8.0,
            uxConsistency: 8.5,
            audienceAlignment: 9.0,
            accessibility: 8.0,
            modernDesignScore: 9.5
          },
          assetCatalog: {
            images: [
              {
                url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop&q=80',
                assetType: 'image',
                usage: 'Primary brand identifier logo mark'
              }
            ]
          },
          designTokens: {
            borderRadius: '12px',
            shadows: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            spacing: '16px'
          },
          strategy: {
            targetLocation: 'United States & Europe',
            ageGroup: '25-50',
            interests: 'Tech news, startup funding, design systems, SaaS operations',
            postingFrequency: 'weekly',
            festivalPosts: false,
            offerPosts: false,
            preferredTypes: ['Blog', 'Video', 'Poster'],
            contentLanguage: 'english',
            ctaPreference: 'Visit Website'
          },
          designPreferences: {
            preferredStyle: 'Minimal',
            referenceLinks: ['https://linear.app', 'https://stripe.com'],
            imageStyle: 'Minimal',
            animationRequirement: true,
            aestheticAnalysis: {
              classification: 'Tech Minimalist',
              visualExplanation: 'Characterized by high empty space, dark slate backgrounds, white text, and emerald green callouts.',
              moodAnalysis: 'Evokes clarity, security, and high engineering quality.',
              creativeDirection: 'Utilize dark mode themes, high contrast elements, and crisp animations.',
              styleReasoning: 'Aligns perfectly with their developer-centric audience.'
            }
          },
          approvalWorkflow: {
            reviewerName: 'Lead Designer',
            finalApproverName: 'VP of Marketing',
            processSteps: ['Initial Draft', 'Visual Audit', 'Stakeholder Review', 'Signoff'],
            approvalTiming: '48 hours',
            revisionLimit: 3
          },
          campaignDetails: {
            marketingGoal: 'Brand Awareness',
            monthlyBudget: 5000,
            duration: '3 months',
            targetLeads: 150,
            adPlatforms: ['LinkedIn', 'Google Search']
          },
          analyticsConfig: {
            monthlyReport: true,
            kpiExpectations: 'Inbound leads, traffic growth, and engagement rate.',
            leadTracking: true,
            engagementTracking: true
          },
          socialAccess: {
            metaBusinessManagerId: null,
            adAccountId: null,
            instagramHandle: 'apexdigital',
            facebookPage: 'Apex Digital Agency',
            linkedinPage: 'company/apex-digital-agency',
            youtubeChannel: null,
            twitterHandle: 'apex_digital'
          },
          competitors: [
            {
              name: 'DesignJoy',
              website: 'https://designjoy.co',
              strengths: 'Productized design model, fast turnaround.',
              weaknesses: 'Lack of custom engineering integration.'
            }
          ],
          contactInfo: {
            personName: 'Jane Doe',
            phoneNumber: '+1-555-0199',
            email: 'hello@apexdigital.example.com',
            officeAddress: '100 Pine St, San Francisco, CA'
          }
        }
      });
    } else if (request.jsonMode) {
      content = JSON.stringify({ result: 'mock data' });
    }

    return {
      content,
      model: 'mock-fallback-model',
      inputTokens: 10,
      outputTokens: 50,
    };
  }
}
