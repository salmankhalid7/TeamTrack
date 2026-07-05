Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const { pdfText, disciplineId, disciplineName } = await req.json();
    const groqKey = Deno.env.get('GROQ_API_KEY') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    console.log('Keys available:', { groq: !!groqKey, supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });

    if (!groqKey || !supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ success: false, error: 'Missing environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Generate daily tasks as JSON: {"tasks":[{"day":1,"title":"...","description":"...","learningObjectives":[],"estimatedHours":4,"resources":[]}]}. 20-30 days, progressive, practical. ONLY return JSON.' },
          { role: 'user', content: `Discipline: ${disciplineName}. Plan: ${pdfText?.substring(0, 8000) || 'No content provided'}` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    const grokData = await groqRes.json();
    const tasks = JSON.parse(grokData.choices[0].message.content).tasks;

    const cleanTasks = tasks.filter(t => t.day && t.title).map(t => ({
      discipline_id: disciplineId,
      day_number: t.day,
      title: t.title,
      description: t.description || '',
      learning_objectives: t.learningObjectives || [],
      estimated_hours: t.estimatedHours || 4,
      resources: t.resources || [],
      status: 'draft',
      created_at: new Date().toISOString(),
    }));

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/tasks`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(cleanTasks),
    });

    const saved = await insertRes.json();

    return new Response(JSON.stringify({ success: true, tasks: saved }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});