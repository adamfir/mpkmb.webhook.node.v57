const express = require("express");
const app = express();
const {
  exec
} = require('child_process');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const port = 3003;
const secretKey = '1KSzYPRMHad8AUZAyzuVqzDPPiHmDB';
app.use(bodyParser.json());

function verifyWebhook(req, res, next) {
  const payload = JSON.stringify(req.body);
  if (!payload) {
    return next('Request body empty');
  }

  const sig = req.get('X-Hub-Signature') || '';
  const hmac = crypto.createHmac('sha1', secretKey);
  const digest = Buffer.from(`sha1=${hmac.update(payload).digest('hex')}`, 'utf8');
  const checksum = Buffer.from(sig, 'utf8');
  if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
    return res.status(401).json({
      message: `Request body digest (${digest}) did not match 'X-Hub-Signature' (${checksum})`
    });
  }
  return next();
}

app.get("/webhook", (req, res) => {
	res.json({ message: "Webhook active" });
});

app.post('/webhook/backend', verifyWebhook, (req, res) => {
  const {
    query: {
      u,
      p
    }
  } = req;
  const decodedPass = Buffer.from(p, 'base64').toString('ascii');
  const origin = `https://${u}:${decodedPass}@github.com/adamfir/mpkmb57.backend.node.git master`;
  const processName = 'MPKMB-API';
  const pullCommand = `cd /home/mpkmb/mpkmb57.backend.node && git pull ${origin}`;

  exec(pullCommand, (error, stdout) => {
    if (error) {
      res.status(400).json({
        message: `There is an error when execute ${pullCommand}`,
        error
      });
    } else if (stdout !== 'Already up to date.\n') {
      console.log(`There is new change. Reload pm2 for ${processName}`);
      res.status(200).json({
        message: `OK. There is new change. Reloading pm2 for ${processName}`
      });
      exec(`cd /home/mpkmb/mpkmb57.backend.node && ./run.sh`, (error2, stdout2) => {
        if (error) {
          console.log('error :>> ', error2);
        }
        // console.log('stdout2 :>> ', stdout2);
      });
    } else {
      res.status(200).json({
        message: 'OK'
      });
    }
  });
});

app.post('/webhook/app', verifyWebhook, (req, res) => {
  const {
    query: {
      u,
      p
    }
  } = req;
  const decodedPass = Buffer.from(p, 'base64').toString('ascii');
  const origin = `https://${u}:${decodedPass}@github.com/RFTaurus/MPKMBProd.git master`;
  const command = `cd /var/www/MPKMBProd && git pull ${origin}`;

  exec(command, (error) => {
    if (error) {
      res.status(400).json({
        message: `There is an error when execute ${command}`,
        error
      });
    }
    res.status(200).json({
      message: 'OK'
    });
  });
});

app.post('/webhook/admin', verifyWebhook, (req, res) => {
  const {
    query: {
      u,
      p
    }
  } = req;
  const decodedPass = Buffer.from(p, 'base64').toString('ascii');
  const origin = `https://${u}:${decodedPass}@github.com/pramesywaraj/mpkmb-admin2020-deploy.git master`;
  const command = `cd /var/www/mpkmb-admin2020-deploy && git pull ${origin}`;

  exec(command, (error) => {
    if (error) {
      res.status(400).json({
        message: `There is an error when execute ${command}`,
        error
      });
    }
    res.status(200).json({
      message: 'OK'
    });
  });
});

app.listen(port, () => console.log(`Running server in port ${port}`));