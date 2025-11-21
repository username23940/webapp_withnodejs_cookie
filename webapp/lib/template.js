

// template 객체
module.exports = {
  html: function(_title, _list, _body, _control){
    return `
    <!doctype html>
    <html>
    <head>
      <title>WEB1 - ${_title}</title>
      <meta charset="utf-8">
    </head>
    <body>
      <a href="/login">login</a>
      <h1><a href="/">WEB</a></h1>
      <p><input type='button' value='night' onclick="nightDayHandler(this)"></p>
      ${_list} <!-- readdir을 통해 파일 목록 배열로 저장한 것을 바탕으로 목록 재정의-->
      ${_control} <!--CRUD-->
      ${_body}
      <p>
        <iframe width="560" height="315" src="https://www.youtube.com/embed/fRXilZ-GOXQ?si=Y-lRJnkE9ZpN50DB" 
          title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; 
          gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </p>
    </body>
    </html>
    `;
  },
  list: function(_filelist){
    /*
    <li><a href="/?id=HTML">HTML</a></li>
    <li><a href="/?id=CSS">CSS</a></li>
    */
    let list = '<ul>';
    for(let i=0; i<_filelist.length; i++){
      list += `<li><a href="/?id=${_filelist[i]}">${_filelist[i]}</a></li>`;
    }
    list += '</ul>';
    return list;
  }
};
  
