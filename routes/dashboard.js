var express = require('express');
var router = express.Router();
var striptags = require('striptags');
var moment = require('moment')

var firebasedb = require('../connection/firebase-admin')
var categoriesRef = firebasedb.ref('/categories')
var articlesRef = firebasedb.ref('/articles')

    router.use(function(req,res,next){
        if(req.session.signinResult=="ygG4h83yeARcrTeSAr3FzOv8CVW2"){
            next();
        }else{
            res.redirect('/')
        }
    });
    router.get('/article/create', function(req, res, next) {
        const editingType = 'article';
        categoriesRef.once('value').then(function(snapshop){
            var categories = snapshop.val();
            res.render('dashboard/article', {categories,editingType});
            });
        });
    router.get('/article/:id', function(req, res, next) {
        const editingType = 'article';
        const ID = req.param('id')
        let categories={};
        categoriesRef.once('value').then(function(snapshop){
            categories = snapshop.val();
        return articlesRef.child(ID).once('value').then(function(snapshot){
            var articles = snapshot.val();
            res.render(`dashboard/article`, {
                    categories,
                    articles,
                    editingType
                });
            });
        })
    });
    router.get('/archives', function(req, res, next) {
        const editingType = 'article';
        let status =req.query.status || "public"
        let categories = {};
        categoriesRef.once('value').then(function(snapshot){
            categories = snapshot.val();
            return articlesRef.orderByChild('updata_time').once('value');
        }).then(function(snapshot){
            let articles = [];
            snapshot.forEach(function(item){
                if(item.val().status===status){
                    articles.push(item.val())    
                }
            });
            articles.reverse();
            res.render('dashboard/archives', {
                categories,
                articles,
                striptags,
                moment,
                status,
                editingType
            });
        })
    });
    router.get('/categories', function(req, res, next) {
        const editingType = 'category';
    categoriesRef.once('value').then(function(snapshop){
        const categories = snapshop.val();
        const info = req.cookies.info;
        res.render('dashboard/categories',{
            categories,
            info,
            hasInfo: info!==undefined,
            editingType
        })
    })
    });
    router.post('/categories/creat',function(req,res){
        const data =req.body;
        const categoryRef = categoriesRef.push();
        const key = categoryRef.key
        data.id = key;
        categoriesRef.orderByChild('name').equalTo(data.name).once('value').then(function(snapshop){
            if(snapshop.val()!==null){
                res.cookie('info',"已有相同名稱",{
                    maxAge:1000
                });
                res.redirect('/dashboard/categories')
            }else(
                categoryRef.set(data).then(function(){
                res.redirect('/dashboard/categories')
            })    
            )
      })
    });
    router.post('/categories/delete/:id',function(req,res){
        const id = req.param('id');
        categoriesRef.child(id).remove();
        res.cookie('info',"欄位已刪除",{
            maxAge:1000
        });
        // req.session.info='欄位已刪除';
        res.redirect('/dashboard/categories')
    });
    router.post('/article/create',function(req,res){
        const data = req.body;
        const articleRef = articlesRef.push();
        const key = articleRef.key;
        const updateTime = Math.floor(Date.now()/1000);
        data.id = key;
        data.update_time = updateTime;
        articleRef.set(data).then(function(){
            res.redirect(`/dashboard/article/${key}`);
        })
    });
    router.post('/article/updata/:id',function(req,res){
        const ID = req.param('id');
        const data = req.body;
        articlesRef.child(ID).update(data).then(function(){
            res.redirect(`/dashboard/article/${ID}`);
        })
    });
    router.post('/article/delete/:id',function(req,res){
        const id = req.param('id');
        articlesRef.child(id).remove();
        res.cookie('info',"文章已刪除",{
            maxAge:1000
        });
        res.send('文章已刪除')
        res.end();
    });


module.exports = router;