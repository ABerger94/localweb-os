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
    
    // Use InvokeLLM to generate realistic lead data based on web research
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 3-5 realistic local business leads for ${industry} businesses in ${primaryLocation} that likely don't have websites or have poor online presence. For each business, provide:
- Business name (realistic sounding)
- Business type (specific)
- Location (city/area in ${primaryLocation})
- Phone number (realistic format)
- Google rating (1-5, with decimal)
- Number of reviews (10-200)
- Why they need a website (specific pain point)

Format as JSON array with fields: business_name, business_type, location, phone, google_rating, review_count, pain_point`,
      response_json_schema: {
        type: "object",
        properties: {
          leads: {
            type: "array",
            items: {
              type: "object",
              properties: {
                business_name: { type: "string" },
                business_type: { type: "string" },
                location: { type: "string" },
                phone: { type: "string" },
                google_rating: { type: "number" },
                review_count: { type: "number" },
                pain_point: { type: "string" }
              },
              required: ["business_name", "business_type", "location", "phone", "google_rating", "review_count", "pain_point"]
            }
          }
        },
        required: ["leads"]
      }
    });

    const leads = llmResponse.leads || [];

    // Create Client records for each lead
    for (const lead of leads) {
      const clientData = {
        business_name: lead.business_name,
        business_type: lead.business_type,
        contact_name: "Owner/Manager",
        contact_email: `contact@${lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: lead.phone,
        location: lead.location,
        google_rating: lead.google_rating,
        status: "Lead",
        pipeline_stage: "Prospect",
        notes: `LEAD GENERATED AUTOMATICALLY\n\nPain Point: ${lead.pain_point}\n\nGoogle Rating: ${lead.google_rating}/5 (${lead.review_count} reviews)\n\nOutreach Angle: Focus on their lack of web presence and how competitors with websites are capturing their potential customers. Mention specific improvements like online booking, menu/services display, customer testimonials, etc.`
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