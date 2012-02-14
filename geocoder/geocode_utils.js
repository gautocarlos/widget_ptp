function PointCollection(){
    this.points=[];
    this.geocoding=false;
    this.geocoded=false;
    this.init();
}
PointCollection.prototype.init=function(){
    var cp=this;
    jQuery("body").bind('point-geocoded',function(e){
        cp.geocoded=true;
        for(var i=0;i<cp.points.length;i++){
            if(!cp.points[i].geocoded){
                cp.geocoded=false;
                break;
            }
        }
        if(cp.geocoded){
            jQuery("body").trigger('all-geocoded',[]);
        }
    });
}
PointCollection.prototype.addPoint=function(street_n_address){
    // Normalizar punto
    var parts=street_n_address.split(' ');
    var n=-1;
    var cp=this;
    for(var i=0;i<parts.length;i++){
        var t=parseInt(parts[i]);
        if(!isNaN(t) && t!=0){
            if(i==0||i==parts.length-1){
                n=i;
                break;
            }
        }
    }
    if(n!=-1){
        var number=n!=0?parts.pop():parts.shift();
        var point=new GCPoint(
            parts.join(' '),
            number
        );
        this.points.push(point);
    }
};
PointCollection.prototype.geocode=function(){
    var cp=this;
    if(!cp.geocoding){
        cp.geocoding=true;
        for(var i=0;i<cp.points.length;i++){
            cp.points[i].geocode();
        }
    }  
};
function GCPoint(street,number){
    this.id=street+" "+number;
    this.pt=null;
    this.geocoded=false;
    this.street=street;
    this.number=number;
    if(GCPoint.gc==undefined){
        GCPoint.gc=new usig.GeoCoder();
    }
}
GCPoint.prototype.geocode=function(){
  var cp=this;
  GCPoint.gc.geoCodificarCalleAltura(
      cp.street,
      cp.number,
      function(response){
          if(response instanceof usig.Punto){
              cp.pt=response;
              cp.geocoded=true;
              console.log(cp.id+": "+response);
              jQuery("body").trigger('point-geocoded',[]);
          }else{
            console.log(cp.id+" "+response);
          }
      },
      function(){}
  );
  return cp;
};