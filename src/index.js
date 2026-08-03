export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/estado") {
      if (!env.DB) {
        return Response.json(
          {
            ok: false,
            mensaje: "El Worker funciona, pero falta conectar la base D1 con el nombre DB."
          },
          { status: 500 }
        );
      }

      try {
        const resultado = await env.DB.prepare("SELECT 1 AS conexion").first();
        return Response.json({
          ok: true,
          mensaje: "El Worker está conectado con Cloudflare D1.",
          resultado
        });
      } catch (error) {
        return Response.json(
          {
            ok: false,
            mensaje: "El Worker encontró D1, pero la consulta falló.",
            error: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
