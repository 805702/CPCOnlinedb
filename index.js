require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');

const db = require('./models');
const {demand, auth} = require('./routes')
const handle = require('./handlers');

const port = process.env.PORT;
const app = express();

app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());

app.get('/', (req, res)=>{
    db.sequelize.query('select * from country',{
        type:db.sequelize.QueryTypes.SELECT
    })
    .then(result=>{
        res.send(JSON.stringify(result))
    })
})

app.use('/api/auth',auth);
app.use('/api/demand',demand);

app.use(handle.notFound)
app.use(handle.errors);

app.listen(port, console.log(`Server started on port ${port}`))