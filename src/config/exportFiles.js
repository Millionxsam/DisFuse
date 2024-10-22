module.exports = [
  {
    name: "instructions.txt",
    content: `
      These are the instructions about what to do after you export your project from DisFuse.
      If you need help with anything about DisFuse, including these instructions, want to share your code, get important updates, or just want to be a part of the community, make sure to join our Discord server!
      https://dsc.gg/disfuse

      Explanation of files:
      After you extracted this folder, you should see the following files:

      package.json - Pre-generated information about the project, including required dependencies. This is one of the base files required to run any javascript project.
      index.js - The main file of the project. This file contains ALL of the javascript code for your bot. When you use a block in the DisFuse workspace, it automatically converts it to javascript code and adds it to the index.js file.
      (project name).df - This is a .df (DisFuse) file, which you can use to load the project back into the DisFuse workspace in case you didn't save it to another file. You can go to the DisFuse website, and click the "load" button at the top, and select this file to bring back all the blocks that you had at the time of exporting.
      instructions.txt - These instructions

      What to do next:

      Now that you have the code for your bot, you need a way to host it. There are various ways to host Discord bots, you can even run one on your own computer!
      Below are different methods of hosting Discord bots. All of the methods listed are free, but not all of them are 24/7. If you are willing to pay to host your Discord bot, you can search up a tutorial on YouTube about how to host a Discord bot with paid methods, like Heroku (which used to be free), which are more reliable and have more resources than free services.

      The methods listed in these instructions include:
      1. Local hosting on your computer (Advanced, free, not 24/7) - Run the code on your own computer. This is obviously free, but it won't keep the bot running 24/7, unless you are willing to keep the program and your computer running all the time, or if you have a spare computer you can keep running all the time.
      2. Replit (Pretty easy, free, not 24/7) - A hosting service you can use to host any kind of project (Nodejs, python, html, etc.). But unfortunately, their free plan does not include 24/7 hosting, unless you want to pay for it
      3. Free Discord bot hosting services like EuroFusion, Nexcord, etc. (Very easy, free, 24/7) - Hosting services that are specifically designed to host Discord bots. These services have a free plan and also paid plans if you want more resources and reliability.
   
      Detailed steps for these methods are below:

      Method 1. Local hosting on your computer (Free, not 24/7)

      Any computer is capable of running javascript code. You just need to install a few things and do a few commands, but it's pretty easy.
      It's recommended not to keep the program running on your pc 24/7, because it can be bad for your pc over time. But if you have a spare computer lying around, it should be fine.

      Do the following steps on whatever computer you want to host your bot on:

      Step 1: Install NodeJS

      If you don't know what NodeJS is, it is runtime environment for JavaScript that can run on computers. JavaScript is primarily used for client-side programming, while Node.js allows developers to build server-side applications using JavaScript.
      Even though Discord bots are created using the javascript language, it actually uses Node.js, and that uses javascript as its language.

      go to https://nodejs.org
      Download Node.js (LTS)

      It should download a .msi file. Run the file and go through the setup process just like any other app, and leave all the options on default.

      Step 2. Run the code
      Now you actually have to run the code that came in this zip folder.

      After extracting, it is recommended that you move the folder somewhere else besides your downloads, so you know where it is located. Some people create a dedicated folder for their projects on their computer drive, or you can just put the folder on your desktop.
      NOTE: It is okay to keep the folder wherever you want, this is just advice to make sure you know where the folder is located instead of being unorganized in your downloads folder.

      Open the Windows terminal to your project folder.
      To do this:
      Open your file explorer and go to your project folder (the folder where this file is located)
      Right-click anywhere in the empty space on your file explorer, and the menu should have an option that says "open in terminal".

      If that option does not appear for some reason, you can also:
      Click the bar at the top of file explorer that shows the path/location of the file.
      Delete the whole path after clicking it, and type: "cmd" and press enter. This will also open terminal in that folder.
      NOTE: You can also open the terminal app by searching in the start menu, like any other app. But this will not work because the terminal has to be opened TO your project folder. There is a way to open the terminal app like any other app, and navigate to your project folder. But it's easier to just do one of the above methods.

      Once you have the terminal opened to your folder, type: "npm start" and press enter.
      This will start your project. If you are running it for the first time, it might do some steps to install required dependencies first and take a little longer.
      Then it should start your bot like normal and your bot should be online.
      If you want to keep this program running 24/7, you will have to keep the terminal open.
      If you press Control + C keys at the same time while in the terminal, it will stop your project.
      If you close out of the terminal, it will also stop your project.

      Method 2. Replit (Pretty easy, free, not 24/7)

      Replit is a website you can use to run any type of code, that includes node.js, python, html websites, and much more. It's also much easier to set up than hosting locally on your computer.
      But unfortunately, you are not able to keep your bot running 24/7 unless you pay money (it used to be free, but they removed their free feature).

      Step 1: Create a repl
      
      In Replit, projects are called "repls". So you need to create a repl for your bot.

      Go to https://repl.it
      Login or create an account

      When you're at the home page, there should be a list of all your repls. This is probably empty if you just created your account.
      There should be a button to create a repl.

      Click "create repl"
      Choose template "Node.JS"
      Make a title for your repl, this can be whatever you want.

      Step 2: Import your files
      On the left side of your screen, there should be a section that shows your current files in your repl. By default, in the Node.JS template, there are index.js and package.json files.
      Delete all the files that are there already. Click the three dots next to the file, and click delete for all of the files.

      To import your code, click the three dots at the top of the section
      Click "upload file"
      Navigate to your project folder (the folder this file is in)
      Select all of the files in the folder.
      "Instructions.txt" and the "(project name).df" files are not required, but you can choose to import them if you want, maybe to save them for later.
      "Package.json", "index.js", and any other files are required. You need to import them for your bot to work properly.
      After you uploaded your files, we need to run the code.

      Step 3: Run the code

      Click the green "run" button at the top of the screen.
      This will start your project. If you are running it for the first time, it might do some steps to install required dependencies first and take a little longer.
      Then it should start your bot like normal and your bot should be online.

      When you close out of the repl, the bot will go offline after a few minutes unless you pay money.

      Method 3: Free Discord bot hosting services like EuroFusion, Nexcord, etc. (Very easy, free, 24/7):

      Some websites are specifically designed to host Discord bots. These include websites like EuroFusion, Nexcord, etc.
      (These websites may be able to host other things like Minecraft servers, but their main focus is Discord bots)

      You can use any of these websites to host your bot. This guide will show you how to host your bot in EuroFusion, but you could also use any other similar website.
      Most of these sites have a similar type of system, and they're pretty easy to understand. But they might have different free and/or paid plans.

      EuroFusion and Nexcord both have a pretty good free plan, and also have paid plans as well.
      I personally prefer EuroFusion because I have had a much better experience with it, regarding uptime, speed, and reliability. Even though the resources may seem a bit underwhelming, that's not the main thing that affects performance.

      EuroFusion url: https://eurofusion.parham200.ir
      Nexcord url: https://nexcord.com

      EuroFusion guide:

      Step 1. Create a server
      In these sites, projects are called "servers". Some sites may call them "nodes".

      Go to the EuroFusion url, and create an account by clicking the free (or paid) plan, or click the "account" button at the top.
      You should be led to the accounts page. Click the "Create server" button.
      Choose a name for your server and select how many resources you want to dedicate to the server.
      Keep in mind that you only have a limited amount of resources in your account. If you only want to have one server in your account, you can use all of your resources. If you want to have multiple servers, then you will need to divide the resources how you want.
      Your total resources available can be seen in the accounts page earlier. These can be upgraded with paid plans.

      Step 2. Access the panel & upload files
      After creating a server, go back the accounts page on the website and click the "panel" button. You will need to log in using the email you used with your Discord account, and the password that was sent to you in an email from EuroFusion.
      You can change the password to something custom later in the panel.

      Once in the panel, select your server.
      It might say something like "installing your server, try again in a few minutes". If it does say that, just wait a few minutes and come back later.
      
      Go to the "files" tab.
      Click the "upload" button.
      Navigate to your project folder (the folder this file is in)
      Select all of the files in the folder.
      "Instructions.txt" and the "(project name).df" files are not required, but you can choose to import them if you want, maybe to save them for later.
      "Package.json", "index.js", and any other files are required. You need to import them for your bot to work properly.
      After you uploaded your files, we need to run the code.

      Step 3. Run the code

      Go back to the "console" tab.
      Click the "start" button
      This will start your project. If you are running it for the first time, it might do some steps to install required dependencies first and take a little longer.
      Then it should start your bot like normal and your bot should be online.

      You can use these similar steps for any other type of website that provides Discord bot hosting, like Nexcord.
      `,
  },
  {
    name: "package.json",
    content: `{
      "name": "disfuse-bot",
      "version": "1.0.0",
      "description": "A Discord bot created with DisFuse",
      "main": "index.js",
      "dependencies": {
        "asynckit": "^0.4.0",
        "axios": "^1.7.7",
        "combined-stream": "^1.0.8",
        "delayed-stream": "^1.0.0",
        "discord-api-types": "^0.33.5",
        "discord-gamecord": "^4.4.2",
        "discord-logs": "^2.2.1",
        "discord.js": "^14.15.3",
        "easy-json-database": "^1.5.1",
        "fast-deep-equal": "^3.1.3",
        "form-data": "^4.0.0",
        "html-entities": "^2.5.2",
        "lodash": "^4.17.21",
        "lodash.snakecase": "^4.1.1",
        "magic-bytes.js": "^1.10.0",
        "mime-db": "^1.52.0",
        "mime-types": "^2.1.35",
        "moment": "^2.30.1",
        "process": "^0.11.10",
        "tr46": "^0.0.3",
        "ts-mixer": "^6.0.4",
        "tslib": "^2.6.2",
        "undici": "^5.27.2",
        "undici-types": "^5.26.5",
        "webidl-conversions": "^3.0.1",
        "whatwg-url": "^5.0.0",
        "ws": "^8.17.0",
        "dotenv": "^16.0.3",
        "lyrics-finder": "^21.7.0",
        "ms": "^2.1.3"
      },
      "scripts": {
        "start": "node index.js",
        "test": "echo Error: no test specified && exit 1"
      },
      "keywords": [],
      "author": "",
      "license": "ISC"
    }
    
  `,
  },
];
