const express = require("express");
const fs = require("fs");
const client = require("https");
const crypto = require('crypto')
const { createCanvas, loadImage } = require("canvas");

const app = express();
const port = process.env.PORT || '3000';

app.get("/", [
  validateRequest,
  createIdentifier,
  downloadBackground,
  downloadLogo,
  renderText,
  composeImage,
  sendImage,
  cleanupFiles,
]);

function validateRequest(req, res, next) {
  if (!req.query.background){
    return res.status(400).send("missing background");
  }
  if (!req.query.logo){
    return res.status(400).send("missing logo");
  }
  if (!req.query.text){
    return res.status(400).send("missing text");
  }
  next();
}

function createIdentifier(req, res, next) {
  const identifier = crypto.randomUUID();
  req.identifier = identifier;
  next();
}

async function downloadBackground(req, res, next) {
  console.log("downloading background");
  const url = req.query.background;
  client.get(url, (webRes) => {
    if (webRes.statusCode < 200 || webRes.statusCode > 299) {
      return res.status(400).send(`Got status code ${webRes.statusCode} while downloading background`);
    }
    webRes.pipe(fs.createWriteStream(`./${req.identifier}-background.jpg`)).once("close", () => {
      next();
    });
  }).on("error",(err)=>{
    console.log(err);
    return res.status(500).send("error downloading background");
  });
}

function downloadLogo(req, res, next) {
  console.log("downloading logo");
  const url = req.query.logo;
  client.get(url, (webRes) => {
    if (webRes.statusCode < 200 || webRes.statusCode > 299) {
      return res.status(400).send(`Got status code ${webRes.statusCode} while downloading logo`);
    }
    webRes.pipe(fs.createWriteStream(`./${req.identifier}-logo.jpg`)).once("close", () => {
      next();
    });
  }).on("error",(err)=>{
    return res.status(500).send("error downloading background");
  });
}

async function renderText(req, res, next) {
  const width = 1000;
  const height = 100;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = "#44FFFFFF";
  context.fillRect(0, 0, width, height);

  context.font = "bold 70pt Menlo";
  context.textAlign = "left";
  context.textBaseline = "top";
  const text = req.query.text;
  const textWidth = context.measureText(text).width;
  context.fillStyle = "#444";;
  context.fillText(text, 0, 10);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(`./${req.identifier}-text.png`, buffer);
  next(); 
}

async function composeImage(req, res, next) {
  console.log("composing image");
  const background = await loadImage(`./${req.identifier}-background.jpg`);
  const logo = await loadImage(`./${req.identifier}-logo.jpg`);
  const width = background.width;
  const height = background.height;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
 
  const logoPadding = 20;
  

  context.drawImage(background, 0, 0, width, height);
  context.drawImage(logo, width - logo.width - logoPadding, height - logo.height - logoPadding);


  const textPadding = 30;
  context.font = "bold 120pt Menlo";
  context.textAlign = "left";
  context.textBaseline = "top";
  const text = req.query.text;
  const textSize = context.measureText(text);

  context.fillStyle = "rgba(255, 255, 255, 0.8)"
  context.fillRect(0, 0, textSize.width + 4*textPadding, 200);

  context.fillStyle = "#444";;
  context.fillText(text, textPadding, textPadding);

  //context.drawImage(text, textPadding, textPadding);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(`./${req.identifier}-composite.png`, buffer);
  next();
}

async function sendImage(req, res, next) {
  console.log("sending image");
  const buffer = fs.readFileSync(`./${req.identifier}-composite.png`);
  res.setHeader("Content-Type", "image/png");
  res.send(buffer);
  next(); 
}

async function cleanupFiles(req, res, next) {
  console.log("cleaning up files");
  fs.unlinkSync(`./${req.identifier}-background.jpg`);
  fs.unlinkSync(`./${req.identifier}-logo.jpg`);
  fs.unlinkSync(`./${req.identifier}-text.png`);
  fs.unlinkSync(`./${req.identifier}-composite.png`);
  next();
}


app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});
