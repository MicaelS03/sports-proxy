const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/live/:user/:pass/:id", async (req, res) => {
  const { user, pass, id } = req.params;
  const chId = id.replace(".ts", "").replace(".m3u8", "");
  const upstream = `http://kstv.us:8080/live/${user}/${pass}/${chId}.m3u8`;

  try {
    const upResp = await fetch(upstream);
    const text = await upResp.text();

    if (text.includes("#EXTM3U")) {
      const base = `${req.protocol}://${req.get("host")}/ts/${user}/${pass}`;
      const rewritten = text.replace(
        /^([^#][^\s]+\.ts.*)$/gm,
        (match) => `${base}/${encodeURIComponent(match.trim())}`
      );
      res.set("Content-Type", "application/vnd.apple.mpegurl");
      res.set("Access-Control-Allow-Origin", "*");
      return res.send(rewritten);
    }

    res.set("Content-Type", "video/MP2T");
    res.set("Access-Control-Allow-Origin", "*");
    upResp.body.pipe(res);
  } catch (e) {
    res.status(502).send("Erro no proxy");
  }
});

app.get("/ts/:user/:pass/*", async (req, res) => {
  const { user, pass } = req.params;
  const segUrl = decodeURIComponent(req.params[0]);
  const fullUrl = segUrl.startsWith("http")
    ? segUrl
    : `http://kstv.us:8080/${segUrl}`;

  try {
    const upResp = await fetch(fullUrl);
    res.set("Content-Type", "video/MP2T");
    res.set("Access-Control-Allow-Origin", "*");
    upResp.body.pipe(res);
  } catch (e) {
    res.status(502).send("Erro no segmento");
  }
});

app.listen(PORT, () => console.log(`Proxy a correr na porta ${PORT}`));
