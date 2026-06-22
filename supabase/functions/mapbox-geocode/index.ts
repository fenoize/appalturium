import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const token = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
  if (!token) {
    return new Response(
      JSON.stringify({ enabled: false, error: 'MAPBOX_PUBLIC_TOKEN no configurado' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') ?? '').trim();
    if (!q || q.length < 3) {
      return new Response(
        JSON.stringify({ enabled: true, features: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const mbxUrl =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
      `?country=cl&language=es&autocomplete=true&limit=6&types=address,place,locality,neighborhood` +
      `&access_token=${token}`;

    const res = await fetch(mbxUrl);
    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ enabled: true, error: `Mapbox ${res.status}`, detail: text }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const data = await res.json();

    // Simplificar respuesta para el cliente
    const features = (data.features ?? []).map((f: any) => {
      const ctx: any[] = f.context ?? [];
      const place = ctx.find((c) => c.id?.startsWith('place'))?.text ?? null;
      const locality = ctx.find((c) => c.id?.startsWith('locality'))?.text ?? null;
      const region = ctx.find((c) => c.id?.startsWith('region'))?.text ?? null;
      const [lng, lat] = f.center ?? [];
      return {
        id: f.id,
        place_name: f.place_name,
        text: f.text,
        address: f.address ?? null,
        lat,
        lng,
        comuna: place ?? locality ?? null,
        region,
      };
    });

    return new Response(
      JSON.stringify({ enabled: true, features }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ enabled: true, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
