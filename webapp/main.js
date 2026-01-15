const http = require('http');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');
const path = require('path');
const template = require('./lib/template.js');
const cookie = require('cookie');

function authIsOwner(request, response) {
  var isOwner=false; // 로그인 여부 확인 기본값은 False
  var cookies = {}
  if(request.headers.cookie) { // cookie 값 없으면 에러 나니 조건문. undefined 아닌 어떤 값이 있으면 True로 인식
    var cookies = cookie.parse(request.headers.cookie);
  };
  if (cookies.email==='hi@naver.com' && cookies.password ==='1111') { // 객체 접근
    isOwner = true;
  };
  return isOwner;
}
function authStatusUI(request, response) {
  var authStatusUI = '<a href="/login">login</a>'; // logout UI 제공
  if (authIsOwner(request, response)){
    return `<a href="/logout_process">logout</a>`;
  }
  return authStatusUI;
}

console.log('🔥 main.js started');

// 데이터 폴더 절대 경로
const filepath = path.join(__dirname, "data"); // data 폴더의 경로를 변수로 설정

const app = http.createServer(function(request, response){

  console.log('📩 request received:', request.url);
  
  const _url = request.url;
  const queryData = url.parse(request.url, true).query;
  const pathname = url.parse(_url, true).pathname; // query string 제외
  var isOwner = authIsOwner(request, response); // 함수화
  
  if(pathname === '/'){
    if(!queryData.id){ // 홈. 빈문자열 false 반환 + ! = True
      fs.readdir(filepath, function(err, filelist){
        if(err){ // 모든 async 함수에 오류 처리 필요
          console.error(err);
          response.writeHead(500);
          return response.end('Internal Server Error');
        }
        const title = 'Welcome';
        const description = 'Hello, Node.js';
        const list = template.list(filelist);
        const html = template.html(title, list, `<h2>${title}</h2><p>${description}</p>`, `<a href="/create">create</a>`, authStatusUI(request, response)); // 함수화
        response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        response.end(html);
      });
    } else { // 파일 상세
      var filteredId = path.parse(queryData.id).base; // url 세탁(임의 파일 접근 금지) 
      const filePath = path.join(filepath, encodeURIComponent(filteredId)); // filepath에 query string의 id를 합쳐 Path로 재정의
      fs.readFile(filePath, "utf8", function(err, description){ // readFile -> readdir -> 출력(async 처리이므로 readdir 마지막에 둬야함) 
        if(err){
          response.writeHead(404);
          return response.end('File Not Found');
        }
        fs.readdir(filepath, function(err, filelist){
          if(err){
            response.writeHead(500);
            return response.end('Internal Server Error');
          }
          const title = queryData.id; // 변수 중복 X 다른 scope이기 때문
          const list = template.list(filelist);
          const html = template.html(title, list,
            `<h2>${title}</h2><p>${description}</p>`,
            `<a href="/create">create</a>
             <a href="/update?id=${title}">update</a>
             <form action="/delete_process" method="post" onsubmit="return confirm('really?');">
               <input type="hidden" name="id" value="${title}">
               <input type="submit" value="delete">
             </form>`, authStatusUI(request, response)
          );
          response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
          response.end(html);
        });
      });
    }
  } else if(pathname === '/create'){ // 다른 기능
    if(authIsOwner(request, response) === false) { // req, res 순서로 되어야 cookie 읽을 수 있음
      response.end('Login required');
      return false ; // createServer의 콜백함수 종료
    }
    fs.readdir(filepath, function(err, filelist){
      if(err){
        response.writeHead(500);
        return response.end('Internal Server Error');
      }
      const title = 'WEB - create';
      const list = template.list(filelist);
      const html = template.html(title, list,
        `<form action="/create_process" method="post" accept-charset="UTF-8">
           <p><input type="text" name="title" placeholder="title(only en)"></p>
           <p><textarea name="description" placeholder="description(only en)"></textarea></p>
           <p><input type="submit"></p>
         </form>`, '', authStatusUI(request, response));
      response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      response.end(html);
    });
  } else if(pathname === '/create_process'){
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => { // 화살표 함수 이용
      const post = qs.parse(body); // post 된 데이터('data')를 받음. chunk로 쪼개져 들어오는 것을 body에 축
      const title = post.title; // body의 name 속성값으로 식별, 그 폼 안의 값이 실제 데이터
      const description = post.description;
      fs.writeFile(path.join(filepath, title), description, 'utf8', function(err){
        if(err){
          response.writeHead(500);
          return response.end('Internal Server Error');
        }
        response.writeHead(302, {Location: `/?id=${title}`}); // redirection은 path 필요 X
        response.end();
      });
    });
  } else if(pathname === '/update'){
    if(authIsOwner(request, response) === false) {
      response.end('Login required');
      return false ; // createServer의 콜백함수 종료
    }
    var filteredId = path.parse(queryData.id).base;
    const filePath = path.join(filepath, encodeURIComponent(filteredId));
    fs.readFile(filePath, 'utf8', function(err, description){
      if(err){
        response.writeHead(404);
        return response.end('File Not Found');
      }
      fs.readdir(filepath, function(err, filelist){
        if(err){
          response.writeHead(500);
          return response.end('Internal Server Error');
        }
        const title = queryData.id;
        const list = template.list(filelist);
        const html = template.html(title, list,
          `<form action="/update_process" method="post" accept-charset="UTF-8">
             <input type="hidden" name="id" value="${title}">
             <p><input type="text" name="title" placeholder="title(only en)" value="${title}"></p>
             <p><textarea name="description" placeholder="description(only en)">${description}</textarea></p>
             <p><input type="submit"></p>
           </form>`, '', authStatusUI(request, response));  // 수정이므로 값이 미리 존재해야함. query string으로 value 속성 활용
        response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        response.end(html);
      });
    });
  } else if(pathname === '/update_process'){
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      const post = qs.parse(body);
      const id = post.id; // 변하지 않는 값
      const title = post.title; // 수정된 값
      const description = post.description;
      fs.rename(path.join(filepath, id), path.join(filepath, title), function(err){ // rename -> writeFile -> 출력(async 처리이므로 마지막에 둬야함) 
        if(err){
          response.writeHead(500);
          return response.end('Internal Server Error');
        }
        fs.writeFile(path.join(filepath, title), description, 'utf8', function(err){
          if(err){
            response.writeHead(500);
            return response.end('Internal Server Error');
          }
          response.writeHead(302, {Location: `/?id=${title}`});
          response.end();
        });
      });
    });
  } else if(pathname === '/delete_process'){
    if(authIsOwner(request, response) === false) {
      response.end('Login required');
      return false ; // createServer의 콜백함수 종료
    }
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      const post = qs.parse(body);
      const id = post.id; // body의 name 속성값으로 식별, 그 폼 안의 값이 실제 데이터
      fs.unlink(path.join(filepath, id), function(err){
        if(err){
          response.writeHead(500);
          return response.end('Internal Server Error');
        }
        response.writeHead(302, {Location: `/`});
        response.end();
      });
    });
  } else if (pathname === '/login') {
    fs.readdir(filepath, function(err, filelist){
        if(err){ // 모든 async 함수에 오류 처리 필요
          console.error(err);
          response.writeHead(500);
          return response.end('Internal Server Error');
        }
        const title = 'Login';
        const description = 'Login to control';
        const list = template.list(filelist);
        const html = template.html(title, list, 
                                   `<form action='/login_process' method='post'>
                                     <p><input type='text' name='email' placeholder='email'></p>
                                     <p><input type='password' name='password' placeholder='password'></p> // 가림 처리
                                     <p><input type='submit'></p>
                                   </form>`, 
                                   `<a href="/create">create</a>`);
        response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        response.end(html);
      });
  } else if (pathname === '/login_process') {
    let body = '';
    request.on('data', chunk => { body += chunk; });  // data 이벤트 끝나기 전에 parse 실행되므로(비동기화) -> end 이벤트 안에서 처리(비동기 완료 시점 기준으로 로직 분기)
    request.on('end', () => {
      const post = qs.parse(body);
      if (post.email==='hi@naver.com' && post.password ==='1111') {
        response.writeHead(302, { 
                           'Set-Cookie':[`email=${post.email}`, `password=${post.password}`],  
                            Location: '/'});
        response.end();  
        } else {
          response.end('who?');
        }
    });
  } else if ( pathname === '/logout_process') {
    let body = '';
    request.on('data', chunk => { body += chunk; });  
    const post = qs.parse(body);
    response.writeHead(302, { 
                       'Set-Cookie':[`email=; Max-Age=0`, `password=; Max-Age=0`],  
                        Location: '/'});
    response.end();  
  };
}); // createserver 닫기

console.log('🚀 before listen')

app.listen(3000, '0.0.0.0', () => {
  console.log('Server listening on port 3000');
});
