const http = require('http');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');
const path = require('path');
const template = require('./lib/template.js');

// 데이터 폴더 절대 경로
const filepath = path.join(__dirname, "data"); // data 폴더의 경로를 변수로 설정

const app = http.createServer(function(request, response){
  const _url = request.url;
  const queryData = url.parse(request.url, true).query;
  const pathname = url.parse(_url, true).pathname; // query string 제외

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
        const html = template.html(title, list, `<h2>${title}</h2><p>${description}</p>`, `<a href="/create">create</a>`);
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
             </form>`
          );
          response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
          response.end(html);
        });
      });
    }
  } else if(pathname === '/create'){ // 다른 기능
    fs.readdir(filepath, function(err, filelist){
      if(err){
        response.writeHead(500);
        return response.end('Internal Server Error');
      }
      const title = 'WEB - create';
      const list = template.list(filelist);
      const html = template.html(title, list,
        `<form action="/create_process" method="post" accept-charset="UTF-8">
           <p><input type="text" name="title" placeholder="title"></p>
           <p><textarea name="description" placeholder="description"></textarea></p>
           <p><input type="submit"></p>
         </form>`, '');
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
             <p><input type="text" name="title" placeholder="title" value="${title}"></p>
             <p><textarea name="description" placeholder="description">${description}</textarea></p>
             <p><input type="submit"></p>
           </form>`, '');  // 수정이므로 값이 미리 존재해야함. query string으로 value 속성 활용
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
  } else {
    response.writeHead(404);
    response.end('Not Found');
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server listening on port 3000');
});
