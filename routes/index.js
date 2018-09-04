var express = require('express');
var router = express.Router();
var striptags = require('striptags');
var moment = require('moment')
var csrf = require('csurf');
var bodyParser = require('body-parser')
var csrfProtection = csrf({ cookie: true })
var parseForm = bodyParser.urlencoded({ extended: false })


var firebase = require('../connection/firebase-auth')
var firebasedb = require('../connection/firebase-admin')
var categoriesRef = firebasedb.ref('/categories')
var articlesRef = firebasedb.ref('/articles')

firebasedb.ref('test').once('value',function(snapshot){
  console.log(snapshot.val());
})

/* GET home page. */
router.get('/', function(req, res, next) {
    let categoryID = "";
    let signinResult = req.session.signinResult;
    let pageNow = parseInt(req.query.page) || 1;
    var category = {};
    var articles = [];
    var articlesShow=[];
    categoriesRef.once('value').then(function(snapshot){
      category = snapshot.val();
      return articlesRef.orderByChild('update_time').once('value').then(function(snapshot){
      snapshot.forEach(function(item){
        if(item.val().status=="public"){
          articles.push(item.val())
          articles.reverse();
        }
      });
          //分頁製作
          var datalength = articles.length;
          var perpage = 3;
          var TotalPage = Math.ceil(datalength/perpage);
          var pageMin = ((pageNow-1)*perpage)+1;
          var pageMax = pageNow*perpage;
          articles.forEach(function(item,i){
            var pageNum = i+1;
            if( pageNum >= pageMin && pageNum <= pageMax){
              articlesShow.push(item);
            } 
          })
      res.render('index', {signinResult,articlesShow,articles,category,categoryID,striptags,moment,TotalPage,pageNow});
      })
    })
});
router.get('/:categoryID', function(req, res, next) {
  let signinResult = req.session.signinResult
  let categoryID = req.params.categoryID || "";
  let pageNow = parseInt(req.query.page) || 1;
  var category = {};
  var articles = [];
  var articlesShow=[];
  categoriesRef.once('value').then(function(snapshot){
    category = snapshot.val();
    return articlesRef.orderByChild('update_time').once('value').then(function(snapshot){
    snapshot.forEach(function(item){
      if(categoryID){
        if(item.val().category==categoryID){
          articles.push(item.val())
          articles.reverse();
        }
      }
      else if(item.val().status=="public"){
        articles.push(item.val())
        articles.reverse();
      };
    });
    if(articles.length===0){
      const title="該分類沒有資料";
      res.render('error',{articles,category,signinResult,categoryID,moment,title});
      return
    }
        //分頁製作
        var datalength = articles.length;
        var perpage = 3;
        var TotalPage = Math.ceil(datalength/perpage);
        var pageMin = ((pageNow-1)*perpage)+1;
        var pageMax = pageNow*perpage;
        articles.forEach(function(item,i){
          var pageNum = i+1;
          if( pageNum >= pageMin && pageNum <= pageMax){
            articlesShow.push(item);
          } 
        })
    res.render('index', {signinResult,articlesShow,articles,category,categoryID,striptags,moment,TotalPage,pageNow});
    })
  })
});
router.get('/post/:id', function(req, res, next) {
  let ID = req.params.id;
  let categoryID="";
  let category="";
  let signinResult = req.session.signinResult;
  articlesRef.child(ID).once('value').then(function(snapshot){
    let articles = snapshot.val();
    if(!articles){
      const title="該頁面不存在"
      res.render('error',{articles,category,signinResult,categoryID,moment,title});
      return;
    }
    categoryID = articles.category
    return categoriesRef.once('value').then(function(snapshot){
      let category = snapshot.val();
    if(signinResult == undefined || signinResult == ""){
      res.cookie('signinResult',"請先登錄或是註冊",{
        maxAge:1000
      })
      res.redirect('/auth/signin');
    }else{
      res.render('post', {articles,category,signinResult,categoryID,moment});
    }
    })
  })
});
router.get('/auth/signon',csrfProtection,function(req,res,next){
  let categoryID="";
  let signinResult = req.cookies.signinResult
  articlesRef.once('value').then(function(snapshot){
  var articles = snapshot.val();
  return categoriesRef.once('value').then(function(snapshot){
    var category = snapshot.val();
    res.render('dashboard/signon', {articles,category,categoryID,moment,signinResult,categoryID,csrfToken: req.csrfToken()});
    })
  })
});
router.get('/auth/signin',csrfProtection,function(req,res,next){
    let categoryID="";
    let signinResult = req.cookies.signinResult
    articlesRef.once('value').then(function(snapshot){
    var articles = snapshot.val();
    return categoriesRef.once('value').then(function(snapshot){
      var category = snapshot.val();
      res.render('dashboard/signin', {articles,category,categoryID,moment,signinResult,csrfToken: req.csrfToken()});
    })
  })
});
router.post('/auth/signon',function(req,res,next){
  const email = req.body.email;
  const password = req.body.password;
  const confrimPassword = req.body.confirm_password;
  if(password==confrimPassword){
    firebase.auth().createUserWithEmailAndPassword(email,password)
    .then(function(user){
      req.session.signinResult=user.user.uid;
      res.redirect('/');
    })
    .catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
        res.cookie('signinResult',"帳戶已經存在",{
          maxAge:1000
    })
    res.redirect('/auth/signon');
  })
  }else{
    res.cookie('signinResult',"密碼與確認密碼不符合",{
      maxAge:1000
    })
    res.redirect('/auth/signon');
  }
  
})
router.post('/auth/signinIng', parseForm,csrfProtection,function(req,res,next){
  const email = req.body.email;
  const password = req.body.password;
  // req.session.signinResult = email;
  firebase.auth().signInWithEmailAndPassword(email,password)
    .then(function(user){
      req.session.signinResult=user.user.uid;
      res.redirect('/');
    })
    .catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
      res.cookie('signinResult',"Email或是密碼有誤",{
        maxAge:1000
      })
      res.redirect('/auth/signin')
    // ...
  });
})
router.post('/auth/signout',function(req,res,next){
  req.session.signinResult="";
  res.end();
})

module.exports = router;
