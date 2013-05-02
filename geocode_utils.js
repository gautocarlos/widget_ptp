function PointCollection(){
    this.points=[];
    this.geocoding=false;
    this.geocoded=false;
    this.norm_ready=false;
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
    new usig.NormalizadorDirecciones.init({
        onReady:function(e){
            if(!cp.norm_ready){
                cp.norm_ready=true;
                if(cp.geocoding){
                    cp.geocoding=false;
                    cp.geocode();
                }
            }
        },
    });
}
PointCollection.prototype.addPoint=function(street_n_number){
    var point=new GCPoint(street_n_number);
    this.points.push(point)
};
PointCollection.prototype.geocode=function(){
    var cp=this;
    if(!cp.geocoding){
        cp.geocoding=true;
        if(cp.norm_ready){
            for(var i=0;i<cp.points.length;i++){
                cp.points[i].geocode();
            }
        }
    }  
};
function GCPoint(street_n_number){
    this.id=street_n_number;
    this.pt=null;
    this.geocoded=false;
    this.street=street_n_number;
    if(GCPoint.gc==undefined){
        GCPoint.gc=new usig.GeoCoder();
    }
}
GCPoint.prototype.geocode=function(){
  var cp=this;
  console.log(usig.NormalizadorDirecciones.normalizar(cp.street,1));
  var direccion=usig.NormalizadorDirecciones.normalizar(cp.street,1)[0];
  console.log(direccion);
  cp.id=cp.street;
  GCPoint.gc.geoCodificarDireccion(
      direccion,
      function(response){
      console.log(response);
          if(response instanceof usig.Punto){
              cp.pt=response;
              cp.geocoded=true;
              jQuery("body").trigger('point-geocoded',[]);
          }else{
            console.log(cp.id+" "+response);
          }
      },
      function(){}
  );
  return cp;
};