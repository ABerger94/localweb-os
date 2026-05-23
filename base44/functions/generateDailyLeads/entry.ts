import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Target industries and locations - customize these based on your market
    const targetIndustries = [
      'restaurant',
      'plumber',
      'electrician',
      'hair salon',
      'barber shop',
      'landscaping',
      'house cleaning',
      'HVAC',
      'roofing contractor',
      'painting contractor',
      'flooring',
      'catering',
      'bakery',
      'coffee shop',
      'fitness studio',
      'yoga studio',
      'auto repair',
      'pet grooming',
      'dentist',
      'chiropractor'
    ];

    // Get current city/area from existing clients or use default
    const existingClients = await base44.asServiceRole.entities.Client.list();
    const locations = existingClients
      .map(c => c.location)
      .filter(Boolean);
    
    const primaryLocation = locations.length > 0 
      ? locations[0] 
      : 'your local area';

    const generatedLeads = [];
    const industry = targetIndustries[Math.floor(Math.random() * targetIndustries.length)];
    
    // Search for REAL businesses using web search
    const searchQuery = `${industry} ${primaryLocation} no website phone number address`;
    
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Search the web for REAL ${industry} businesses in ${primaryLocation} that DO NOT have a website. These are prime leads for a web design agency.

Look specifically for businesses that:
- Appear only on Google Maps, Yelp, or Facebook but have no dedicated website
- Have a Google listing that says "No website" or only links to a social media profile
- Are listed on directories but have no linked website URL

For each business found WITHOUT a website, extract:
- REAL business name (exactly as listed)
- Business type
- REAL location/city
- REAL phone number (from their listing)
- Google rating if available
- Number of reviews
- Google Maps or directory search URL

IMPORTANT: 
1. Only return businesses that DO NOT have their own website. Skip any business that has a real website.
2. Only return businesses that actually exist. Do NOT make up names, phone numbers, or addresses.
3. If you cannot find real businesses without websites, return an empty list.

Format as JSON array with fields: business_name, business_type, location, phone, google_rating, review_count, has_website, google_search_url, source_url`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          leads: {
            type: "array",
            items: {
              type: "object",
              properties: {
                business_name: { type: "string", description: "Real business name" },
                business_type: { type: "string" },
                location: { type: "string", description: "City/area" },
                phone: { type: "string", description: "Actual phone number from listing" },
                google_rating: { type: "number", description: "Rating or 0 if not found" },
                review_count: { type: "number", description: "Number of reviews or 0" },
                has_website: { type: "boolean" },
                google_search_url: { type: "string" },
                source_url: { type: "string", description: "URL where this info was found" }
              },
              required: ["business_name", "business_type", "location", "phone", "google_search_url"]
            }
          }
        },
        required: ["leads"]
      }
    });

    const leads = llmResponse.leads || [];

    // Create Client records for each REAL lead
    for (const lead of leads) {
      const clientData = {
        business_name: lead.business_name,
        business_type: lead.business_type,
        contact_name: "Owner/Manager",
        contact_email: `contact@${lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: lead.phone,
        location: lead.location,
        google_rating: lead.google_rating || 0,
        status: "Lead",
        pipeline_stage: "Prospect",
        notes: `REAL LEAD FROM WEB SEARCH\n\nGoogle Search: ${lead.google_search_url}\nSource: ${lead.source_url || 'Web search'}\nHas Website: ${lead.has_website ? 'Yes' : 'No'}\n\nGoogle Rating: ${lead.google_rating || 'N/A'}/5 (${lead.review_count || 'N/A'} reviews)\n\nPhone: ${lead.phone}\n\nOutreach Angle: ${lead.has_website ? 'Website exists but may need improvements' : 'No website - major opportunity for web development'}`
      };

      const createdClient = await base44.asServiceRole.entities.Client.create(clientData);
      generatedLeads.push(createdClient);
    }

    return Response.json({ 
      success: true, 
      message: `Generated ${generatedLeads.length} new leads`,
      leads: generatedLeads 
    });
  } catch (error) {
    console.error('Lead generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});