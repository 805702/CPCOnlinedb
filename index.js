require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');

const db = require('./models');
const {demand, auth, user, examinations, result, examCategory} = require('./routes')
const handle = require('./handlers');

const port = process.env.PORT;
const app = express();

app.use(cors({
origin: 'http://localhost:3000'
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('uploads'))

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
app.use('/api/user/',user);
app.use('/api/exams/', examinations)
app.use('/api/result', result)
app.use('/api/examCategory', examCategory)

app.use(handle.notFound)
app.use(handle.errors);

app.listen(port, console.log(`Server started on port ${port}`))