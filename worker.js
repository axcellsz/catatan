export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // POST /submit -> simpan ke KV DATA
    if (request.method === "POST" && url.pathname === "/submit") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return new Response("Body harus JSON", { status: 400 });
      }

      const name = (payload.name || "").trim();
      const phone = (payload.phone || "").trim();
      const type = (payload.type || "").trim().toUpperCase();

      const allowedTypes = ["REG", "OPR", "VPN", "AXB"];

      if (!allowedTypes.includes(type)) {
        return new Response("Jenis penjualan tidak valid", { status: 400 });
      }

      if (!name || !phone) {
        return new Response("Nama dan nomor HP wajib diisi", { status: 400 });
      }

      const id = crypto.randomUUID();

      const record = {
        id,
        name,
        phone,
        type,
        createdAt: new Date().toISOString(),
      };

      // simpan ke KV DATA, prefix bisa apa saja (di sini pakai "sale:")
      await env.DATA.put(`sale:${id}`, JSON.stringify(record));

      return new Response(JSON.stringify({ success: true, id }), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      });
    }

    // GET /list -> ambil semua data dari KV DATA
    if (request.method === "GET" && url.pathname === "/list") {
      const listResult = await env.DATA.list({ prefix: "sale:" });

      const items = [];
      for (const key of listResult.keys) {
        const value = await env.DATA.get(key.name);
        if (!value) continue;

        try {
          items.push(JSON.parse(value));
        } catch {
          // kalau parse gagal, skip
        }
      }

      // sort terbaru dulu
      items.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt < b.createdAt ? 1 : -1;
      });

      return new Response(JSON.stringify({ items }), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      });
    }

    // GET asset (index.html, dll) dari KV PAGES
    if (request.method === "GET") {
      let key = url.pathname === "/" ? "index.html" : url.pathname.slice(1);

      const asset = await env.PAGES.get(key);

      if (!asset) {
        return new Response("Not found", { status: 404 });
      }

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
