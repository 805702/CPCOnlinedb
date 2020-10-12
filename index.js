require('dotenv').config();
const express = require('express');
const handle = require('./handlers');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./models');

const routes = require('./routes')

const port = process.env.PORT;
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res)=>{
    db.sequelize.query('select * from country',{
        type:db.sequelize.QueryTypes.SELECT
    })
    .then(result=>{
        res.send(JSON.stringify(result))
    })
})

app.use('/api/auth',routes.auth);

app.use(handle.notFound)
app.use(handle.errors);

app.listen(port, console.log(`Server started on port ${port}`))