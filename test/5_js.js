  
  var Links = {
    setColor(color)  {
      var alist = document.querySelectorAll('a') ;
      var i =0 ;
      while(i<alist.length) {
      alist[i].style.color=color;
      i=i+1;
     // $('a').css('color', color) ;
      }
    }
  }
  var Body = {
    setColor(color)  {
      document.querySelector('body').style.color = color ;
      // $('body').css('color', color) ; 
    },
  }
    
  function nightDayHandler(self) {
    var target = document.querySelector('body') ;
    if (self.value === 'night') {
      target.style.backgroundColor='black' ;
      Body.setColor('white'); 
      self.value='day' ;
      
      Links.setColor('yellow') ;
    } 
    else {
      target.style.backgroundColor='white' ;
      Body.setColor('black');
      self.value='night' ;
      
      Links.setColor('blue');
    }
  }
