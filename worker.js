const ALLOWED_TYPES = ["REG","OPR","VPN","AXB","ATX","OTX","UJC","CRD"];

function prefixForType(type) {
  switch (type) {
    case "REG": return "reg:";
    case "OPR": return "opr:";
    case "VPN": return "vpn:";
    case "AXB": return "axb:";
    case "ATX": return "atx:";
    case "OTX": return "otx:";
    case "UJC": return "ujc:";
    case "CRD": return "crd:";
    default: throw new Error("Unknown type");
  }
}

// ====== HELPER UNTUK BULAN (YYYY-MM) ======
function getMonthKeyFromDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // contoh: 2025-11
}

function getMonthKeyFromISO(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return getMonthKeyFromDate(d);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ============= CREATE / SUBMIT =============
    if (request.method === "POST" && url.pathname === "/submit") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return new Response("Body harus JSON", { status: 400 });
      }

      const type = (payload.type || "").trim().toUpperCase();
      if (!ALLOWED_TYPES.includes(type)) {
        return new Response("Jenis penjualan tidak valid", { status: 400 });
      }

      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const month = getMonthKeyFromISO(createdAt); // <-- bulan transaksi
      const prefix = prefixForType(type);
      let record;

      // REG / OPR / VPN
      if (type === "REG" || type === "OPR" || type === "VPN") {
        const jenisTrx = (payload.jenisTrx || "").trim();
        const hargaModal = Number(payload.hargaModal || 0);
        const hargaJual = Number(payload.hargaJual || 0);

        if (!jenisTrx || isNaN(hargaModal) || isNaN(hargaJual)) {
          return new Response("Data REG/OPR/VPN tidak lengkap", { status: 400 });
        }

        const keuntungan = hargaJual - hargaModal;

        record = {
          id,
          type,
          jenisTrx,
          hargaModal,
          hargaJual,
          keuntungan,
          createdAt,
          month, // <--
        };
      }

      // AXB
      else if (type === "AXB") {
        const namaPengelola = (payload.namaPengelola || "").trim();
        const nomorPengelola = (payload.nomorPengelola || "").trim();

        const hargaPaket = Number(payload.hargaPaket || 0);

        if (!namaPengelola || !nomorPengelola || isNaN(hargaPaket)) {
          return new Response("Data AXB tidak lengkap", { status: 400 });
        }

        const nomorA1 = (payload.nomorA1 || "").trim();
        const nomorA2 = (payload.nomorA2 || "").trim();
        const nomorA3 = (payload.nomorA3 || "").trim();
        const nomorA4 = (payload.nomorA4 || "").trim();
        const nomorA5 = (payload.nomorA5 || "").trim();

        const hargaA1 = Number(payload.hargaA1 || 0);
        const hargaA2 = Number(payload.hargaA2 || 0);
        const hargaA3 = Number(payload.hargaA3 || 0);
        const hargaA4 = Number(payload.hargaA4 || 0);
        const hargaA5 = Number(payload.hargaA5 || 0);

        const totalHargaNomor =
          hargaA1 + hargaA2 + hargaA3 + hargaA4 + hargaA5;
        const keuntungan = totalHargaNomor - hargaPaket;

        record = {
          id,
          type,
          namaPengelola,
          nomorPengelola,
          hargaPaket,
          nomorA1,
          hargaA1,
          nomorA2,
          hargaA2,
          nomorA3,
          hargaA3,
          nomorA4,
          hargaA4,
          nomorA5,
          hargaA5,
          totalHargaNomor,
          keuntungan,
          createdAt,
          month, // <--
        };
      }

      await env.DATA.put(prefix + id, JSON.stringify(record));

      return new Response(JSON.stringify({ success: true, id }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // ============= UPDATE =============
    if (request.method === "POST" && url.pathname === "/update") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return new Response("Body harus JSON", { status: 400 });
      }

      const id = (payload.id || "").trim();
      const type = (payload.type || "").trim().toUpperCase();
      if (!id || !ALLOWED_TYPES.includes(type)) {
        return new Response("ID atau type tidak valid", { status: 400 });
      }

      const prefix = prefixForType(type);
      const key = prefix + id;
      const existing = await env.DATA.get(key);
      if (!existing) {
        return new Response("Data tidak ditemukan", { status: 404 });
      }

      const existingObj = JSON.parse(existing);

      const createdAt =
        existingObj.createdAt || new Date().toISOString();

      // pakai month lama kalau ada; kalau tidak, hitung dari createdAt
      const month =
        existingObj.month || getMonthKeyFromISO(createdAt) || getMonthKeyFromDate(new Date());

      let record;

      // REG / OPR / VPN
      if (type === "REG" || type === "OPR" || type === "VPN") {
        const jenisTrx = (payload.jenisTrx || "").trim();
        const hargaModal = Number(payload.hargaModal || 0);
        const hargaJual = Number(payload.hargaJual || 0);

        if (!jenisTrx || isNaN(hargaModal) || isNaN(hargaJual)) {
          return new Response("Data REG/OPR/VPN tidak lengkap", { status: 400 });
        }

        const keuntungan = hargaJual - hargaModal;

        record = {
          id,
          type,
          jenisTrx,
          hargaModal,
          hargaJual,
          keuntungan,
          createdAt,
          month,
        };
      }

      // AXB
      else if (type === "AXB") {
        const namaPengelola = (payload.namaPengelola || "").trim();
        const nomorPengelola = (payload.nomorPengelola || "").trim();
        const hargaPaket = Number(payload.hargaPaket || 0);

        if (!namaPengelola || !nomorPengelola || isNaN(hargaPaket)) {
          return new Response("Data AXB tidak lengkap", { status: 400 });
        }

        const nomorA1 = (payload.nomorA1 || "").trim();
        const nomorA2 = (payload.nomorA2 || "").trim();
        const nomorA3 = (payload.nomorA3 || "").trim();
        const nomorA4 = (payload.nomorA4 || "").trim();
        const nomorA5 = (payload.nomorA5 || "").trim();

        const hargaA1 = Number(payload.hargaA1 || 0);
        const hargaA2 = Number(payload.hargaA2 || 0);
        const hargaA3 = Number(payload.hargaA3 || 0);
        const hargaA4 = Number(payload.hargaA4 || 0);
        const hargaA5 = Number(payload.hargaA5 || 0);

        const totalHargaNomor =
          hargaA1 + hargaA2 + hargaA3 + hargaA4 + hargaA5;
        const keuntungan = totalHargaNomor - hargaPaket;

        record = {
          id,
          type,
          namaPengelola,
          nomorPengelola,
          hargaPaket,
          nomorA1,
          hargaA1,
          nomorA2,
          hargaA2,
          nomorA3,
          hargaA3,
          nomorA4,
          hargaA4,
          nomorA5,
          hargaA5,
          totalHargaNomor,
          keuntungan,
          createdAt,
          month,
        };
      }

      await env.DATA.put(key, JSON.stringify(record));

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // ============= DELETE =============
    if (request.method === "POST" && url.pathname === "/delete") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return new Response("Body harus JSON", { status: 400 });
      }

      const id = (payload.id || "").trim();
      const type = (payload.type || "").trim().toUpperCase();
      if (!id || !ALLOWED_TYPES.includes(type)) {
        return new Response("ID atau type tidak valid", { status: 400 });
      }

      const prefix = prefixForType(type);
      const key = prefix + id;

      await env.DATA.delete(key);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // ============= LIST PER TYPE (dengan filter bulan) =============
    if (request.method === "GET" && url.pathname === "/list") {
      const type = (url.searchParams.get("type") || "").toUpperCase();
      if (!ALLOWED_TYPES.includes(type)) {
        return new Response("Jenis penjualan tidak valid", { status: 400 });
      }

      // month = "YYYY-MM"; kalau tidak ada → default bulan sekarang
      const monthParam = url.searchParams.get("month");
      const targetMonth =
        monthParam && /^\d{4}-\d{2}$/.test(monthParam)
          ? monthParam
          : getMonthKeyFromDate(new Date());

      const prefix = prefixForType(type);
      const listResult = await env.DATA.list({ prefix });

      const items = [];
      for (const key of listResult.keys) {
        const value = await env.DATA.get(key.name);
        if (!value) continue;
        try {
          const obj = JSON.parse(value);

          // fallback untuk data lama yg belum punya field month
          let itemMonth = obj.month;
          if (!itemMonth && obj.createdAt) {
            itemMonth = getMonthKeyFromISO(obj.createdAt);
          }

          // kalau tidak bisa tentukan bulan, tetap disimpan
          if (itemMonth && itemMonth !== targetMonth) {
            continue; // skip bulan lain
          }

          items.push(obj);
        } catch {
          // skip kalau parse gagal
        }
      }

      // urutkan dari terbaru ke lama
      items.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt < b.createdAt ? 1 : -1;
      });

      return new Response(JSON.stringify({ items }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // ============= STATIC (PAGES) =============
    if (request.method === "GET") {
      let key = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const asset = await env.PAGES.get(key);

      if (!asset) {
        return new Response("Not found", { status: 404 });
      }

      let contentType = "text/plain; charset=utf-8";
      if (key.endsWith(".html")) contentType = "text/html; charset=utf-8";
      else if (key.endsWith(".js"))
        contentType = "application/javascript; charset=utf-8";
      else if (key.endsWith(".css"))
        contentType = "text/css; charset=utf-8";
      else if (key.endsWith(".json"))
        contentType = "application/json; charset=utf-8";

      return new Response(asset, {
        status: 200,
        headers: { "content-type": contentType },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  },
};
