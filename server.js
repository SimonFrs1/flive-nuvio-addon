const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";

const EMBED_URL =
  "https://ddelta.flive.dpdns.org/embed/racing/skyf1?server=origin&quality=1080p&category=racing";
const HLS_BASE = "https://ddelta.flive.dpdns.org/live-cdn/skyf1";

const CHANNEL = {
  id: "flive:skyf1",
  type: "tv",
  name: "Sky Sports F1 HD",
  poster: "https://streamed.pk/api/images/badge/sky-sports.png"
};

function send(res, status, body, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

async function resolveHls() {
  const response = await fetch(EMBED_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`Embed request failed: ${response.status}`);
  }

  const html = await response.text();

  // This mirrors the resolver in the supplied flive JS bundle:
  // const _0x = ({...});
  const match = html.match(/const _0x = ({[^;]+});/);

  if (!match) {
    throw new Error("Could not find the stream token object in the embed page");
  }

  const tokens = JSON.parse(match[1]);
  const quality = tokens["1080p"];

  if (!quality || !quality._t || !quality._e || !quality._n) {
    throw new Error("1080p stream tokens are missing");
  }

  return (
    HLS_BASE +
    "1080p" +
    "/index.m3u8?_t=" + encodeURIComponent(quality._t) +
    "&_e=" + encodeURIComponent(quality._e) +
    "&_n=" + encodeURIComponent(quality._n)
  );
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    });
    return res.end();
  }

  if (url.pathname === "/health") {
    return send(res, 200, { ok: true, service: "flive-nuvio-addon" });
  }

  if (url.pathname === "/manifest.json") {
    return send(res, 200, manifest);
  }

  if (url.pathname === "/catalog/tv/flive-f1.json") {
    return send(res, 200, { metas: [CHANNEL] });
  }

  if (url.pathname === "/meta/tv/flive:skyf1.json") {
    return send(res, 200, {
      meta: {
        id: CHANNEL.id,
        type: "tv",
        name: CHANNEL.name,
        poster: CHANNEL.poster,
        videos: []
      }
    });
  }

  if (url.pathname === "/stream/tv/flive:skyf1.json") {
    try {
      const hls = await resolveHls();

      return send(res, 200, {
        streams: [
          {
            name: "F1 Live",
            title: "Sky Sports F1 HD",
            url: hls,
            behaviorHints: {
              notWebReady: false
            }
          }
        ],
        cacheMaxAge: 20
      });
    } catch (error) {
      console.error(error);
      return send(res, 200, { streams: [] });
    }
  }

  return send(res, 404, { error: "Not found" });
}

const manifest = {
  "id": "com.flive.nuvio",
  "version": "1.0.0",
  "name": "F1 Live – Nuvio",
  "description": "Live F1 stream from flive.dpdns.org",
  "resources": ["catalog", "meta", "stream"],
  "types": ["tv"],
  "catalogs": [
    {
      "type": "tv",
      "id": "flive-f1",
      "name": "F1 Live",
      "extra": []
    }
  ],
  "idPrefixes": ["flive:"],
  "behaviorHints": {
    "adult": false,
    "p2pNotSupported": true
  }
};

http.createServer((req, res) => {
  handle(req, res).catch(err => {
    console.error(err);
    send(res, 500, { error: "Internal server error" });
  });
}).listen(PORT, HOST, () => {
  console.log(`F1 Live Nuvio addon listening on ${HOST}:${PORT}`);
});
