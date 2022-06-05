const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const dotenv = require("dotenv");

const URL = "https://kimetsu-no-yaiba.fandom.com/vi/wiki/Trang_Ch%C3%ADnh";
const CHARACTER_URL_BASE = "https://kimetsu-no-yaiba.fandom.com/vi/wiki/";

const app = express();

//set up
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dotenv.config();

//routes
// egt all characters
app.get("/v1", async (req, res) => {
  const thumbnails = [];
  const limit = Number(req.query.limit);
  try {
    const response = await axios(URL);
    const html = response.data;
    const $ = cheerio.load(html);
    $(".portal", html).each(function () {
      const name = $(this).find("a").attr("title");
      const detailUrl = $(this).find("a").attr("href");
      const image =
        $(this).find("a > img").attr("data-src") ||
        $(this).find("a > img").attr("src");
      thumbnails.push({
        name,
        detailUrl:
          "https://kimetsu-no-yaiba-api.onrender.com/v1" +
          detailUrl.split("/wiki")[1],
        image,
      });
    });

    if (limit && limit > 0) return res.json(thumbnails.slice(0, limit));

    res.json(thumbnails);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get detail character
app.get("/v1/:character", async (req, res) => {
  let url = CHARACTER_URL_BASE + req.params.character;
  const titles = [];
  const details = [];
  const gallery = [];
  const characterObj = {};
  try {
    const response = await axios(url);
    const html = response.data;
    const $ = cheerio.load(html);

    $("h3.pi-data-label", html).each(function () {
      titles.push($(this).text());
    });
    $("div.pi-data-value", html).each(function () {
      details.push(
        $(this)
          .text()
          .replace(/\[\d\]/g, "")
      );
    });

    const image = $("a.image-thumbnail", html).attr("href");

    $("div.wikia-gallery-item", html).each(function () {
      const imgUrl = $(this).find("a > img").attr("data-src");
      gallery.push(imgUrl);
    });

    for (let i = 0; i < titles.length; i++) {
      characterObj[titles[i].toLowerCase()] = details[i];
    }

    res.json({
      name: req.params.character.replace("_", " "),
      image,
      gallery,
      ...characterObj,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server is running");
});
