const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

const { Datastore } = require('@google-cloud/datastore'); 
const store = new Datastore();

app.use(cors());

app.use(bodyParser.json());

app.get('/random', async (req, res) => {
    const query = store.createQuery('Video').order('timestamp');
    const [videos] = await store.runQuery(query);
    
    const video = videos[Math.floor(Math.random() * videos.length)];
    const id = new URL(video.url).searchParams.get('v');

    return res.json({
        id,
        ...video
    });
});

app.post('/videos', async (req, res) => {
    const video = req.body.video;
    const id = new URL(video).searchParams.get('v');

    const query = store.createQuery('Video').filter('url', video);
    const [videos] = await store.runQuery(query);

    if (videos.length > 0) {
        return res.status(400).json({
            status: 400,
            message: `Cette vidéo est déjà dans la base`
        });
    }

    const key = store.key(['Video', id]);

    const doc = {
        key,
        data: {
            url: video,
            timestamp: new Date().toISOString()
        }
    };

    try {
        await store.save(doc);
        return res.status(200).json(doc);
    } catch (e) {
        return res.status(500).send('An error occurred');
    }
});

app.get('/videos', async (req, res) => {
    const page = req.query.page;

    if (page) {
        const n = 18;
        const offset = page * n; 
        const query = store.createQuery('Video').order('timestamp', {
            descending: true
        }).offset(offset).limit(n);
        const [videos] = await store.runQuery(query);

        return res.json(videos);
    }

    const query = store.createQuery('Video').order('timestamp');
    const [videos] = await store.runQuery(query);

    return res.json(videos);
});

const port = process.env.PORT ?? 8080;
app.listen(port, () => {
    console.log(`En écoute sur 0.0.0.0:${port}`);
});