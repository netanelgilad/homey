"use strict";
const PORT = process.env.PORT || 35601;

import * as express from "express";
import * as cors from "cors";
import { urlencoded, json } from "body-parser";
import * as helmet from "helmet";
import { runCommand } from "./runCommand";
import { tvShows } from "./tv-shows";

/* Setup */
const commands = require('./commands');
const Broadlink = require('./device');


/* Server */
let app = express();

app.use(helmet());
app.use(cors());
app.use(urlencoded({ extended: true }));
app.use(json());

app.post('/command/:name', async function(req, res) {
    const command = commands.find((e) => { return e.command == req.params.name; });

    runCommand(command, req, res);
});

tvShows(app);

app.listen(PORT);
console.log('Server running, go to http://localhost:' + PORT);
