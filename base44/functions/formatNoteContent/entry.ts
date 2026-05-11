import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await req.json();

    if (!content || !content.trim()) {
      return Response.json({ error: 'No content provided' }, { status: 400 });
    }

    // Use LLM to analyze and suggest formatting improvements
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a note formatting expert. Analyze the following note content and suggest how to improve its formatting using HTML formatting (bold, italic, headings, lists, tables, etc.). 

Note content:
"${content}"

Return a JSON object with:
1. "formatted_html": the improved HTML version with better structure (use <h2>, <h3>, <strong>, <em>, <ul>, <li>, <table> tags as appropriate)
2. "suggestions": array of specific formatting suggestions applied
3. "structure_type": one of "prose", "list", "table", "mixed" based on how the content is best organized

Make it well-organized and visually clear.`,
      response_json_schema: {
        type: "object",
        properties: {
          formatted_html: { type: "string" },
          suggestions: { type: "array", items: { type: "string" } },
          structure_type: { type: "string" }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});