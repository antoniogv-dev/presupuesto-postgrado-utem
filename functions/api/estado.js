export async function onRequestGet(context) {
  try {
    if (!context.env.DB) {
      return Response.json(
        {
          ok: false,
          mensaje: "No existe la conexión DB."
        },
        { status: 500 }
      );
    }

    const resultado = await context.env.DB
      .prepare("SELECT 1 AS conexion")
      .first();

    return Response.json({
      ok: true,
      mensaje: "La aplicación está conectada con Cloudflare D1.",
      resultado
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mensaje: "La función existe, pero no pudo consultar la base.",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
