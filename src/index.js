function respuestaJson(datos, estado = 200, encabezados = {}) {
  return Response.json(datos, {
    status: estado,
    headers: {
      "Cache-Control": "no-store",
      ...encabezados
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      /*
       * 1. Comprobar conexión con D1
       * GET /api/estado
       */
      if (url.pathname === "/api/estado" && request.method === "GET") {
        if (!env.DB) {
          return respuestaJson(
            {
              ok: false,
              mensaje:
                "El Worker funciona, pero falta conectar la base D1 con el nombre DB."
            },
            500
          );
        }

        const resultado = await env.DB
          .prepare("SELECT 1 AS conexion")
          .first();

        return respuestaJson({
          ok: true,
          mensaje: "El Worker está conectado con Cloudflare D1.",
          resultado
        });
      }

      /*
       * 2. Leer o guardar el estado de la aplicación
       * GET /api/datos
       * PUT /api/datos
       */
      if (url.pathname === "/api/datos") {
        if (!env.DB) {
          return respuestaJson(
            {
              ok: false,
              mensaje: "No se encontró la conexión DB."
            },
            500
          );
        }

        /*
         * Leer los datos guardados
         */
        if (request.method === "GET") {
          const registro = await env.DB
            .prepare(
              `SELECT contenido, actualizado_en
               FROM app_state
               WHERE id = ?`
            )
            .bind(1)
            .first();

          if (!registro) {
            return respuestaJson({
              ok: true,
              datos: {
                programas: [],
                presupuestos: [],
                parametros: {}
              },
              actualizado_en: null
            });
          }

          let datos;

          try {
            datos = JSON.parse(registro.contenido);
          } catch {
            return respuestaJson(
              {
                ok: false,
                mensaje:
                  "La base contiene información que no se puede interpretar como JSON."
              },
              500
            );
          }

          return respuestaJson({
            ok: true,
            datos,
            actualizado_en: registro.actualizado_en
          });
        }

        /*
         * Guardar o reemplazar los datos
         */
        if (request.method === "PUT") {
          let cuerpo;

          try {
            cuerpo = await request.json();
          } catch {
            return respuestaJson(
              {
                ok: false,
                mensaje: "El contenido enviado no es un JSON válido."
              },
              400
            );
          }

          if (
            !cuerpo ||
            typeof cuerpo !== "object" ||
            Array.isArray(cuerpo) ||
            !Object.prototype.hasOwnProperty.call(cuerpo, "datos")
          ) {
            return respuestaJson(
              {
                ok: false,
                mensaje:
                  'Debe enviar un objeto con la forma {"datos": {...}}.'
              },
              400
            );
          }

          const contenido = JSON.stringify(cuerpo.datos);
          const bytes = new TextEncoder().encode(contenido).length;

          if (bytes > 5 * 1024 * 1024) {
            return respuestaJson(
              {
                ok: false,
                mensaje: "La información enviada supera el límite de 5 MB."
              },
              413
            );
          }

          await env.DB
            .prepare(
              `INSERT INTO app_state (
                 id,
                 contenido,
                 actualizado_en
               )
               VALUES (
                 1,
                 ?,
                 CURRENT_TIMESTAMP
               )
               ON CONFLICT(id) DO UPDATE SET
                 contenido = excluded.contenido,
                 actualizado_en = CURRENT_TIMESTAMP`
            )
            .bind(contenido)
            .run();

          return respuestaJson({
            ok: true,
            mensaje: "Los datos se guardaron correctamente."
          });
        }

        return respuestaJson(
          {
            ok: false,
            mensaje: "Método no permitido. Utilice GET o PUT."
          },
          405,
          {
            Allow: "GET, PUT"
          }
        );
      }

      /*
       * 3. Mostrar index.html y demás archivos de public/
       */
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Error del Worker:", error);

      return respuestaJson(
        {
          ok: false,
          mensaje: "Ocurrió un error interno en el Worker.",
          error: error instanceof Error ? error.message : String(error)
        },
        500
      );
    }
  }
};
