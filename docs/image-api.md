# Image API

Creating images for social media is a common task. Often the image is a templated image with some headline text and a logo combined together. While creating this type of image can be done fairly easily with a graphics app, it can quickly become boring and tedious if you need to post frequently. 

Luckily, some programming knowledge can help us out, by automating the task and giving us free time to do things like more programming!

In this tutorial, we'll build an [HTTP REST API](https://www.restapitutorial.com)to create composite images for social media. 

## Overview and Requirements

You'll need the following services and software setup for this tutorial 

- [Git](https://git-scm.com) setup and installed, and a registered [GitHub account](https://github.com).
- [Node.js](https://nodejs.org/) installed
- A registered [Code Capsules](https://codecapsules.io) account.
- An IDE or text editor to create the project in. This tutorial was made using [Visual Studio Code](https://code.visualstudio.com), but feel free to use any tool you like.

## Setting Up The Project

With our requirements in place, we can get started on setting them up to work as needed for our web file project.

### Creating a New Repo 

We need a place to store our code from which [Code Capsules](https://codecapsules.io) can deploy to a capsule.

Head over to [GitHub](https://github.com), and create a new repo. We're calling it _image-api_ here, but you can call it whatever you like. You can choose a **Node** `.gitignore` file to get started. Then clone the new Github repo onto your computer and navigate to that directory in terminal (or command prompt, if you're on Windows).

### Initialising the Base Project

Let's get the base code set up. Start by cloning the new GitHub repo onto your local computer.

Now, go into the directory of the repo you've just cloned. 

We can init a new node project by typing the following at the command line / terminal:

```bash
npm init
```

It's fine to press _enter_ for each of questions it asks - the defaults are good to start with. 

### Installing Packages

Now that we have our project initialised, we can add the packages we will need for our bot. These are:

- [Express](http://expressjs.com). This acts as our web server and HTTP request router. We'll use this to route requests from Slack to the correct logic. 
- [node-canvas](https://www.npmjs.com/package/canvas). This is a graphics library that mimics an HTML canvas element. Canvas elements are 2D graphics elements that can be drawn on. We'll use this to put the images together.
 

Let's type in the following at the command line / terminal to install the packages:

```bash
npm install express canvas
```

Now lets create an `index.js` file, which will be the main file for our app. An easy way to do this is to open up your project folder in an editor, like [Visual Studio Code](visual-studio). Now you can create a new `index.js` file. 

![create index.js in visual studio](create-indexjs.gif)

Save this blank file. 

We also have a font file that we'll need to add to the project. Download and copy [this font](https://www.fontspace.com/short-baby-font-f34907) to your project folder.s

Great, it's time to push this boilerplate project up to git. We can do it with the following from the command prompt or terminal: 

```bash
git add . 
git commit -am 'added libraries, index.js and font'
git push origin
```

## Getting Started with Express

Let's define the inputs and interface of the API to build. We need the user to provide 3 elements:

- A URL to an image to use as the `background`.
- Headline `text` to render over the image.
- A URL to a `logo` to use in the image.

A call to the API should look similar to this: 

```bash
https://image-api.codecapsules.co.za?background=https://example.com/background.png&logo=https://example.com/logo.png&text=my inspirational message
```
When calling an API, the parameters are separated by `&` and the key-value pairs are separated by `=`. The values are also typically URL encoded to ensure they are not misinterpreted. The above call URL encoded would be:

```bash
https://image-api.codecapsules.co.za?background=https%3A%2F%2Fexample.com%2Fbackground.png&logo=https%3A%2F%2Fexample.com%2Flogo.png&text=my%20inspirational%20message
```

[Express](http://expressjs.com) is a popular and well established API framework for node. It is built around the concept of _middleware_ functions. Middleware functions are chained together to provide a processing pipeline for an API request. Let's take a brief look at what that means. 

A basic express API route looks something like this:

```js
app.get("/", function (req, res) {
  res.send("Hello World!");
});
```

`app` refers to an express application, which provides all the API functionality. 
The `"/"` defines the URL endpoint. In this case, it is just the root of the API. 
The inline function is the route handler. This takes the incoming `req`uest, and provides an object to return the API's `res`ult. 

This would be enough to create the image api  - we could put all the code in the one route handler function. However, because Express enables multiple middleware functions to be chained together, we can split our code up more logically. Express allows a route to have multiple chained functions, which are run one after the other. Instead of passing the route one route handler, Express allows us to pass an array of them, like this: 

```js
app.get("/", [function (req, res, next) {
  // do something
  next();
}, function (req, res, next) {
  // do something else
  next();
}, function (req, res) {
  // send the response
  res.send("Hello World!");
}]);
```
Notice that the `next()` function is called after each middleware function has completed its particular function. This is how we can chain together multiple middleware functions.

The functions don't have to be inline - we can use named functions. In this way, the code become very readable, and is almost just like writing down the steps we need to take. We can then implement the functions one at a time. 

If we were to break down the processing that the image API needs to do, one sequence could be: 

- Validate the incoming request for the required parameters.
- Create a unique identifier for the request, so that multiple requests can be handled in parallel.
- Download the background image from the given URL
- Download the logo image from the given URL
- Compose the two images together, along with the text
- Send the Image back to the caller
- Cleanup the downloaded and temporary files made. 

If we write this as a series of middleware functions for the route, it would look something like this:

```js

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

```

This is a very readable way to write the code. It becomes clear to others the steps the API route takes, and the order that it takes them. We can implement each of the steps one at a time.

Let's start by adding the above code to the `index.js` file. We'll also need to import the Express library and set up the Express app. Put together, we can add the following code to the `index.js` file:

```js
const express = require("express");

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

// Add the middleware function implementations below this line

app.listen(port, function () {
  console.log(`Image API listening on port ${port}!`);
});

```

- The first line imports the Express library. 
- The second line creates the Express app. 
- The third line sets the port to listen on. This is normally passed in as an environment variable `process.env.PORT` when the application is hosted. We provide a default value of `3000` if the environment variable is not set.
- Then we have the route handler and the calls to the middleware functions. We'll implement these functions in the next section.
- Finally, we call the `app.listen()` function to start the server on the given port.


## Writing the Middleware Functions

Now that we have the outline of the API, and a list of all the middleware we need to write, we can implement each step. 

### Validation Middleware

To validate the request, we'll need to check that the request contains the required parameters. Express provides a `req` object that contains all the information about the request. The `req` object has a `query` property that contains the query parameters. We can use this to check that the request contains the required parameters. If it doesn't, we can return an http [`400`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) error, which means that the there was something wrong with the request from the caller. We'll also provide a helpful message to the caller, so they are not left guessing what they did wrong. Add the following function just below the `Add the middleware functions below this line` comment.

```js
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
```

### Create Identifier Middleware

Next up, we need to create a unique identifier for the request. This is because we'll be downloading the images from the request URLs, and we'll be creating an output composite image. We'll want to create a unique name, so that it's easy to refer to the images, and so that we can handle multiple requests in parallel. If we just called the downloaded images `background` and `logo` for example, as one request is being served, the files might get overwritten by another incoming request. We'd get the images crossed, and probably end up with some very strange end results. 

To create a unique identifier, we could just create a random number. This would work a lot of the time, but there is a chance that the same number could be chosen. Luckily, this problem has been solved with the very clever invention of something called a [Universally Unique Identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier), or UUID for short. They are also known as Globally Unique Identifiers, or GUIDs. UUIDs/ GUIDs are a type of randomly generated identifier that is virtually guaranteed to be unique - in the whole world, not just our project!


Node has a built-in `crypto`graphy module that can create UUIDs. We can import the `crypto` module by adding the following `require` line to the top of the `index.js` file:

```js
const crypto = require('crypto')
```

Now, let's implement the `createIdentifier` middleware function. Add the following function just below the previous middleware function.

```js
function createIdentifier(req, res, next) {
  const identifier = crypto.randomUUID();
  req.identifier = identifier;
  next();
}
```

This function creates a random UUID, and stores it in the `req` object. Since the `req` object is passed to each of the following middleware functions, we can access this identifier in all of the subsequent functions. You can store all kinds of information on the `req` object - it's sort of like a backpack that you can put stuff in and carry through all the middleware functions.

### Download Background Image Middleware

Next up is the `downloadBackground` function. We need to make a web call to the URL provided by the caller, and save the image to work with later. We'll use the built-in `https` module to make the web call, and the `fs` module to save the image to a temporary location. First, we'll need to import the `https` and `fs` modules. Add the following `require` line s to the top of the `index.js` file:

```js
const fs = require("fs");
const client = require("https");
```

Now let's use these imports in the `downloadBackground` function. Add the following function just below the previous middleware function.

```js
function downloadBackground(req, res, next) {
  const url = req.query.background;
  const file = fs.createWriteStream(`./${req.identifier}-background.jpg`);

  client.get(url, (webRes) => {
    if (webRes.statusCode < 200 || webRes.statusCode > 299) {
      return res.status(400).send(`Got status code ${webRes.statusCode} while downloading background`);
    }
    webRes.pipe(file).once("close", () => {
      next();
    });
  }).on("error",(err)=>{
    return res.status(500).send("error downloading background");
  });
}
```

First, we retrieve the URL of the image to download from the `req` object. This is stored in the `req.query.background` property. Then we create a file stream to write the image to. We'll use the `fs` module to create the file stream, using the [`createWriteStream()`](https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#filehandlecreatewritestreamoptions) function to create the file stream. The argument to this function is the path to the file we want to write to. Notice that we combine the `identifier` we added to the `req`, along with the word `background` to make a unique filename.

Then we make the web call to the URL. We use the built-in `https` module, using its [`get()`](https://nodejs.org/dist/latest-v16.x/docs/api/https.html#httpsgeturl-options-callback) function to make the web call. The first argument to this function is the URL to download the image from. The second argument is a callback function that is called when the web call is complete. The callback function passes a web response object to the callback.

We can check this web response object `webRes` to see if the web call was successful. A simple (but not totally foolproof) way of checking if the call was successful is to check the status code. By convention, web servers should return an `OK` code, which is generally a code within the [200-299 range](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#successful_responses). Therefore, if the status code is less than 200 or greater than 299, we can return an error, and exit early. Note that by calling res.send early, we prevent the next middleware function from being called.

If the web call was successful, we [pipe](https://nodejs.org/en/knowledge/advanced/streams/how-to-use-stream-pipe/) the web response to the file stream. This means that the web response will be written to the file stream. When the web response is complete, the file stream is closed. We can check if the file stream is closed by listening for the [`close`](https://nodejs.org/dist/latest/docs/api/stream.html#event-close) event. When the file stream is closed, we call the `next()` function to move on to the next middleware function.

The `https` client also has an `error` event that we can listen to, for any other errors, such as network errors that may occur. If there is this type of error, we return an error, and exit early.

### Download Logo Image Middleware

To download the logo, we'll need to do the same thing as we did for the background image. Add the following function under the `downloadBackground` function.

```js
function downloadLogo(req, res, next) {
  const url = req.query.logo;
  const file = fs.createWriteStream(`./${req.identifier}-logo.jpg`);

  client.get(url, (webRes) => {
    if (webRes.statusCode < 200 || webRes.statusCode > 299) {
      return res.status(400).send(`Got status code ${webRes.statusCode} while downloading logo`);
    }
    webRes.pipe(file).once("close", () => {
      next();
    });
  }).on("error",(err)=>{
    return res.status(500).send("error downloading logo");
  });
}
```

### Compose Image Middleware

Now we get to the heart of the API's function - putting the images and text together in a composition. The [`canvas`](https://www.npmjs.com/package/canvas) module can do all of this for us. First, we'll need to import the `canvas` module. Add the following `require` line to the top of the `index.js` file:

```js
const { createCanvas, loadImage } = require("canvas");
```

This imports two functions that we'll need from the `canvas` module. The `createCanvas` function creates a canvas object that we can draw our composite image on, and the `loadImage` function loads images from the file system. Using `loadImage` we can load the images we downloaded earlier, and then draw them to the canvas to create our composite image.

```js
async function composeImage(req, res, next) {

  const background = await loadImage(`./${req.identifier}-background.jpg`);
  const logo = await loadImage(`./${req.identifier}-logo.jpg`);

  const width = background.width;
  const height = background.height;

  registerFont("./ShortBaby.ttf", { family: "ShortBaby" });
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
 
  const logoPadding = 20;
  context.drawImage(background, 0, 0, width, height);
  context.drawImage(logo, width - logo.width - logoPadding, height - logo.height - logoPadding);

  const textPadding = 30;
  context.font = "bold 120pt ShortBaby";
  context.textAlign = "left";
  context.textBaseline = "top";

  const textSize = context.measureText(req.query.text);
  context.fillStyle = "rgba(255, 255, 255, 0.8)"
  context.fillRect(0, 0, textSize.width + 4*textPadding, 200);

  context.fillStyle = "#444";;
  context.fillText(req.query.text, textPadding, textPadding);


  const buffer = canvas.toBuffer("image/png");
  req.compositeImageBuffer = buffer;
  next();
}
```

There is quite a bit of code in this function at first glance, so let's break it down. In the first 2 lines, we load up the `background` and `logo` images from file, using the `loadImage` function, along with the identifier we stored in the `req` object. 

In the following 2 lines, we extract and storethe width and height of the background image. Then we load up our font to use, before creating a new, blank canvas object with these dimensions. A blank canvas is like opening up Paint and creating a new file. After we create the canvas, we get a reference to the context of the canvas. The context is the interface to the canvas, and is the way we draw onto the canvas. It has all the functions to add images, text, shapes, fills etc. You can think of it as equivalent to the tools palette, with all the brushes, pens, buckets etc, in Paint or Photoshop. 

Because we want the logo to be a little indented from the right and bottom of the background image, we use the `logoPadding` variable to define the amount of padding we want. Then we draw the background image to the canvas, using the [`drawImage()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage) function. The first argument to this function is the image we want to draw, and the second and third arguments are the x and y coordinates of the top left corner of where we want to place the image. The next 2 coordinates are the width and height of the image we want to draw. 

Then we draw the logo image to the canvas, using the [`drawImage()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage) function again. This time, we place it at the bottom right corner of the canvas, adjusted by the padding amount. 

Now, we need to add the text to the image. We define a padding amount for the text as well, as we'd want it offset from the sides of the image. We use the `textPadding` variable to define this amount. Then we define the font and size we want the text to be, along with the alignment when we draw it. 

Text drawn straight onto an image can be difficult to read, especially if the image has colours close to the text. To solve this problem, we'll first draw a background rectangle behind the text. This will give us a nice contrast between the text and the background. To find out how wide this background should be, we use the [`measureText()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText) function. This function returns an object with the dimensions in pixels that the text would take, given the set font and size. We also set the `fillStyle` to specify the colour the background should be. We're using `rgba` notation, which specifies the Red, Green, Blue and Alpha values for the colour. Alpha is the amount of transparency the fill should have, on a scale from 0(totally transparent) to 1(totally opaque). We then use the [`fillRect()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillRect) function to draw the background rectangle. The first two arguments are the x and y coordinates of the top left corner of the rectangle, and the next two arguments are the width and height of the rectangle. We pad the edges a bit of the background rectangle to make sure the text is not too close to the edges of the background. 

Now we can finally draw the text. First thing is to set the font on the context, and specify the alignment. Then we change the `fillStyle` to the colour we want for the text. This time, we're using the [Hex notation](https://www.w3schools.com/htmL/html_colors_hex.asp) for the colour, in RGB order. `#444` is a dark grey. Then we use the [`fillText()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText) function to draw the text. The first argument is the text we want to draw, and the next two arguments are the x and y coordinates of the top left corner of where we want to draw the text. This is our padding offset. 

Finally, we use the [`toBuffer()`](https://github.com/Automattic/node-canvas#canvastobuffer) function to convert the canvas to a buffer, which is a binary representation of the image which we can use to write an image file. We then use the same trick we used to store the `identifier` on the `req`uest object, so that it is available to the next middleware function to use.


### Returning the Image

Now we need to send the image back to the API caller. Add the following function after the `composeImage` function:

```js
async function sendImage(req, res, next) {
  res.setHeader("Content-Type", "image/png");
  res.send(req.compositeImageBuffer);
  next(); 
}
```

This function sets the headers `Content-Type` to `image/png`, which lets the API caller know the data type to expect. Then we use the [`send`](http://expressjs.com/en/api.html#res.send) function on the `res`ult object to send the image buffer we saved onto the `req` object back the API caller. Then we call `next()` to move on to the next function in the pipeline.

### Cleanup Middleware

The next step is cleanup of the downloaded files, as we don't need them once the image is created and sent back to the API caller. We add empty callbacks, as we don't really need the result of the operation. In a production system, you might log the result in case there is an error when deleting. Add the following function after the `sendImage` function:

```js
async function cleanupFiles(req, res, next) {
  fs.unlink(`./${req.identifier}-background.jpg`, () => {});
  fs.unlink(`./${req.identifier}-logo.jpg`, () => {});
  next();
}
```

## Testing the API out

Now that the API is complete, we can test it out. First we need to start the API. From a terminal, run the following command:

```bash
node index.js
```
You should see the message `Image API listening on port 3000` in the terminal. Our API is now listening for requests on port 3000.

Let's test it out with some example images and text. We'll use the [Code Capsules logo](https://codecapsules.io/assets/images/v2/logo-code-capsules-brand-dark.svg), and a stock image background image we've [linked here](https://codecapsules.io/docs/assets/tutorials/image-api/background.png). And of course, for the text, we'll use the classic "Hello World". 

Combining all this into the URL to call our API looks like this:

```bash
http://localhost:3000?background=https://codecapsules.io/docs/assets/tutorials/image-api/background.png&logo=https://codecapsules.io/assets/images/v2/logo-code-capsules-brand-dark.svg&text=Hello World
```

As we discussed earlier, before we call this, we need to URL encode the parameters. There are a few online services to do this, like [https://www.urlencoder.io](https://www.urlencoder.io). After encoding the URL, it should look like this: 

```bash
http://localhost:3000?background=https%3A%2F%2Fcodecapsules.io%2Fdocs%2Fassets%2Ftutorials%2Fimage-api%2Fbackground.png&logo=https%3A%2F%2Fcodecapsules.io%2Fassets%2Fimages%2Fv2%2Flogo-code-capsules-brand-dark.svg&text=Hello%20World
```

If you have [`curl`](https://curl.se) installed, you can use the following command to test it out:

```bash
curl -X GET "http://localhost:3000?background=https%3A%2F%2Fcodecapsules.io%2Fdocs%2Fassets%2Ftutorials%2Fimage-api%2Fbackground.png&logo=https%3A%2F%2Fcodecapsules.io%2Fassets%2Fimages%2Fv2%2Flogo-code-capsules-brand-dark.svg&text=Hello%20World" > output.png
```
This will create the image, and save it to the file `output.png`. Open it up, and you should see the following:

![composite image from the api](output.png)


You can also test it out straight in the browser by visiting the following URL:

```bash
http://localhost:3000?background=https%3A%2F%2Fwww.imagesource.com%2Fwp-content%2Fuploads%2F2019%2F06%2FRio.jpg&logo=https%3A%2F%2Fcodecapsules.io%2Fassets%2Fimages%2Fv2%2Flogo-code-capsules-brand-dark.svg&text=Hello%20World
```

## Add, Commit and Push Git Changes

Let's add and commit all the files we created to our local repository and then push them to the remote one. Do this by running the commands listed below in a terminal while in the project’s root folder:

```git add -a
git commit -m "Added image editing files"
git push -u origin main
```

Your remote repository will now be up to date with your local one.

## Deploy to Code Capsules

The final step is to deploy our app. Log into your Code Capsules account and link your remote GitHub repository to Code Capsules. Create a Redis Database Capsule and a Backend Capsule and bind the two together after deploying your app. You can follow [this deployment guide](https://codecapsules.io/docs/deployment/how-to-deploy-express-application-to-production/) to see how to do so in greater detail.

That’s it! Your "Image Editing" app should be live and fully functional now.

## Next steps

Nice work on building an API! Hopefully you've seen the possibilites of building APIs with Node.js and Express. If you'd like to learn more about Express, check out [the Express website](https://expressjs.com/).

Some things you can do to improve the API, or just to experiment with it are:

- Allow the font to be passed as a parameter
- Allow text color and background to be passed as a parameter
- We use the `https` module to download the images. This only supports HTTPS requests. We can use the `http` module to download the images if we want to support HTTP requests as well. Or you can try another HTTP client library like [`axios`](https://www.npmjs.com/package/axios).
- Advanced: specify the resulting image size, and how it should resize the background.

## Credits

The background image is from [https://opengameart.org/content/background-3](https://opengameart.org/content/background-3)

The font "ShortBaby" is from [https://www.fontspace.com/short-baby-font-f34907](https://www.fontspace.com/short-baby-font-f34907)] 

The logo is from Code Capsules. 