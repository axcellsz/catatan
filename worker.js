
export default {
  async fetch(request, env, ctx) {
    return new Response("hallo babi", {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  },
};
