export async function onRequest(context) {
  return Response.json({
    ok: true,
    message: "La función está funcionando"
  });
}
