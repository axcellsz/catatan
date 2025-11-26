export default {
  async fetch(request, env, ctx) {
    // Ambil file index.html dari KV binding "PAGES"
    const html = await env.PAGES.get("index.html");

    if (!html) {
      // Kalau key-nya belum ada di KV
      return new Response("index.html tidak ditemukan di KV", {
        status: 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
      });
    }

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  },
};
