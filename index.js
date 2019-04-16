const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const sqlite = require('sqlite')
const dbConnection = sqlite.open('banco.sqlite', { Promise })
const port = process.env.PORT || 3000

app.use('/adim', (request, response, next) => {
    if (request.hostname === "localhost") {
        next()
    } else {
        response.send('Not allowed')
    }
})
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', async (request, response) => {
    const db = await dbConnection
    const categoriasDB = await db.all('select * from categorias;')
    const vagas = await db.all('select * from vagas;')
    const categorias = categoriasDB.map(cat => {
        return {
            ...cat,
            'vagas': vagas.filter(vaga => vaga.categoria === cat.id)
        }
    })
    response.render('home', {
        categorias
    })
})

app.get('/vaga/:id', async (request, response) => {
    const db = await dbConnection
    const vaga = await db.get('select * from vagas where id = ' + request.params.id)
    response.render('vaga', {
        vaga
    })
})

app.get('/admin', (request, response) => {
    response.render('admin/home')
})

app.get('/admin/vagas', async (request, response) => {
    const db = await dbConnection
    const vagas = await db.all('select * from vagas')
    response.render('admin/vagas', { vagas })
})

app.get('/admin/vagas/delete/:id', async (request, response) => {
    const db = await dbConnection
    await db.run('delete from vagas where id = ' + request.params.id)
    response.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async (request, response) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    response.render('admin/nova-vaga', { categorias })
})

app.post('/admin/vagas/nova', async (request, response) => {
    const { titulo, descricao, categoria } = request.body
    const db = await dbConnection
    await db.run(`insert into vagas (categoria,titulo,descricao) values(${categoria},'${titulo}','${descricao}');`)
    response.redirect('/admin/vagas')
})

app.get('/admin/vagas/editar/:id', async (request, response) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    const vaga = await db.get('select * from vagas where id = ' + request.params.id)
    response.render('admin/editar-vaga', { categorias, vaga })
})

app.post('/admin/vagas/editar/:id', async (request, response) => {
    const { titulo, descricao, categoria } = request.body
    const id = request.params.id
    const db = await dbConnection
    await db.run(`update vagas set categoria = ${categoria},titulo = '${titulo}',descricao = '${descricao}' where id = ${id};`)
    response.redirect('/admin/vagas')
})

app.get('/admin/categorias', async (request, response) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    response.render('admin/categorias', { categorias })
})

app.get('/admin/categorias/delete/:id', async (request, response) => {
    const db = await dbConnection
    await db.run(`delete from vagas where vagas.categoria  = (select id from categorias where id = ${request.params.id})`)
    await db.run('delete from categorias where id = ' + request.params.id) 
    response.redirect('/admin/categorias')
})

app.get('/admin/categorias/nova', async (request, response) => {
    response.render('admin/nova-categoria')
})

app.post('/admin/categorias/nova', async (request, response) => {
    const { categoria } = request.body
    const db = await dbConnection
    await db.run(`insert into categorias (categoria) values('${categoria}');`)
    response.redirect('/admin/categorias')
})

app.get('/admin/categorias/editar/:id', async (request, response) => {
    const db = await dbConnection
    const id = request.params.id
    const categoria = await db.get('select * from categorias where id ='+ id)
    response.render('admin/editar-categoria', { categoria })
})

app.post('/admin/categorias/editar/:id', async (request, response) => {
    const categoria = request.body.categoria
    const id = request.params.id
    const db = await dbConnection
    await db.run(`update categorias set categoria = '${categoria}' where id = ${id};`)
    response.redirect('/admin/categorias')
})

const init = async () => {
    const db = await dbConnection
    await db.run('create table if not exists categorias (id integer primary key,categoria text);')
    await db.run('create table if not exists vagas (id integer primary key,categoria integer, titulo text,descricao text);')
}
init();

app.listen(port, (err) => {
    if (err) {
        console.log('Não foi possivel iniciar servidor do jobify')
    } else {
        console.log('Servidor do jobify rodando....')
    }
})