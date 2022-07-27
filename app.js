const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const path = require('path');

const { Datastore } = require('@google-cloud/datastore'); 
const store = new Datastore();

const cons = require('consolidate');

app.use(bodyParser.json());

app.use('/assets', express.static('assets'));
app.engine('html', cons.handlebars);

app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

app.get('/random', async (req, res) => {
    const query = store.createQuery('Video').order('timestamp');
    const [videos] = await store.runQuery(query);
    
    const video = videos[Math.floor(Math.random() * videos.length)].url;
    const id = new URL(video).searchParams.get('v');

    return res.render('index', {
        video: `https://www.youtube.com/embed/${id}`
    });
});

app.post('/api/videos', async (req, res) => {
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

app.get('/api/videos', async (req, res) => {
    const query = store.createQuery('Video').order('timestamp');
    const [videos] = await store.runQuery(query);

    return res.json(videos);
});

const port = process.env.PORT ?? 8080;
app.listen(port, () => {
    console.log(`En écoute sur 0.0.0.0:${port}`);
});