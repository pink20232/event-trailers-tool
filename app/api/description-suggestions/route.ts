import { NextRequest, NextResponse } from 'next/server';

interface SuggestionRequest {
  description: string;
}

interface SuggestionResponse {
  suggestion: string;
  explanation: string;
}

/**
 * API route to generate outcome-driven description suggestions
 * Uses Eventbrite's self-service LLM endpoints
 * Supports Qwen / Mistral models via Eventbrite-hosted API
 * Rewrites event descriptions to be outcome-driven and max 160 characters
 */
// Mock function to generate outcome-driven suggestions
function generateMockSuggestion(description: string): { suggestion: string; explanation: string } {
  // Extract key information from the description
  const lowerDesc = description.toLowerCase();
  
  // Find key elements
  const hasFood = lowerDesc.includes('food') || lowerDesc.includes('eat') || lowerDesc.includes('dining');
  const hasMusic = lowerDesc.includes('music') || lowerDesc.includes('concert') || lowerDesc.includes('band');
  const hasGames = lowerDesc.includes('game') || lowerDesc.includes('play') || lowerDesc.includes('fun');
  const hasVendors = lowerDesc.includes('vendor') || lowerDesc.includes('shop') || lowerDesc.includes('market');
  const hasFamily = lowerDesc.includes('family') || lowerDesc.includes('kid') || lowerDesc.includes('children');
  
  // Count items/activities mentioned
  const itemCount = (description.match(/\d+/g) || []).map(n => parseInt(n)).find(n => n > 10) || 0;
  
  // Build outcome-driven suggestion
  let suggestion = '';
  let explanation = '';
  
  if (hasVendors && itemCount > 0) {
    suggestion = `Make a full day of it with ${itemCount > 0 ? itemCount + '+' : '200+'} food, crafts, music, and games — a California festival the whole family can enjoy.`;
    explanation = '"Make a full day of it" implies value + duration. This sets clear expectations about the experience attendees will have.';
  } else if (hasFood && hasMusic) {
    suggestion = 'Enjoy live music, delicious food, and great company at this unforgettable event experience.';
    explanation = 'Focuses on the outcome (enjoyment) and key activities. Helps attendees imagine the experience.';
  } else if (hasFamily) {
    suggestion = 'Bring the whole family for a day of fun activities, entertainment, and memories you\'ll cherish.';
    explanation = 'Emphasizes family value and emotional outcome (memories). Sets expectation for a family-friendly experience.';
  } else {
    // Generic outcome-driven summary
    const words = description.split(/\s+/).slice(0, 20).join(' ');
    suggestion = `Experience ${words.substring(0, 120)}...`;
    if (suggestion.length > 160) {
      suggestion = suggestion.substring(0, 157) + '...';
    }
    explanation = 'This suggestion focuses on the outcome and value attendees will receive, making it easier for them to imagine the experience.';
  }
  
  // Ensure exactly 160 characters or less
  if (suggestion.length > 160) {
    suggestion = suggestion.substring(0, 157).trim() + '...';
  }
  
  return { suggestion, explanation };
}

export async function POST(request: NextRequest) {
  try {
    const body: SuggestionRequest = await request.json();
    const { description } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Validate description length (prevent extremely long inputs)
    if (description.length > 10000) {
      return NextResponse.json(
        { error: 'Description is too long. Please limit to 10,000 characters.' },
        { status: 400 }
      );
    }

    // MOCK MODE: Generate suggestions without API call for prototype demo
    // Simulate API delay for realism (1 second)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock suggestion based on description content
    const { suggestion, explanation } = generateMockSuggestion(description);
    
    console.log('Generated mock suggestion:', suggestion);
    console.log('Generated explanation:', explanation);

    const result: SuggestionResponse = {
      suggestion: suggestion.trim(),
      explanation: explanation.trim(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating description suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}
