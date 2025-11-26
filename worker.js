export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle POST /submit -> simpan ke KV DATA
    if (request.method === "POST" && url.pathname === "/submit") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return new Response("Body harus JSON", { status: 400 });
      }

      const name = (payload.name || "").trim();
      const phone = (payload.phone || "").trim();

      if (!name || !phone) {
        return new Response("Nama dan nomor HP wajib diisi", { status: 400 });
      }

      // Buat ID unik
      const id = crypto.randomUUID();

      const record = {
        id,
        name,
        phone,
        createdAt: new Date().toISOString(),
      };

      // Simpan ke KV DATA dengan key "user:<id>"
      await env.DATA.put(`user:${id}`, JSON.stringify(record));

      return new Response(JSON.stringify({ success: true, id }), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      });
    }

    // Handle GET -> ambil file dari KV PAGES
    if (request.method === "GET") {
      let key = url.pathname === "/" ? "index.html" : url.pathname.slice(1);

      const asset = await env.PAGES.get(key);

      if (!asset) {
        return new Response("Not found", { status: 404 });
      }

      // Sederhana: tentukan content-type berdasarkan ekstensi
      let contentType = "text/plain; charset=utf-8";
      if (key.endsWith(".html")) contentType = "text/html; charset=utf-8";
      else if (key.endsWith(".js")) contentType = "application/javascript; charset=utf-8";
      else if (key.endsWith(".css")) contentType = "text/css; charset=utf-8";
      else if (key.endsWith(".json")) contentType = "application/json; charset=utf-8";

      return new Response(asset, {
        status: 200,
        headers: {
          "content-type": contentType,
        },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  },
};
