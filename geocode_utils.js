function PointCollection(){
    this.points=[];
    this.geocoding=false;
    this.geocoded=false;
    this.norm_ready=false;
    this.init();
}

PointCollection.prototype.init=function(){
    var cp=this;
    /*
    cuando un punto hace el triger de 'point-geocoded'
    se evalua si todos estan geocodificados correctamente
    y de ser el caso se hace un trigger de 'all-geocoded'
    */
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
    /*
    inicializando normalizador de direcciones de usig
    */
    new usig.NormalizadorDirecciones.init({
        onReady:function(e){
            if(!cp.norm_ready){
                cp.norm_ready=true;
                if(cp.geocoding){
                    cp.geocoding=false;
                    cp.geocode();
                }
            }
        }
    });
};

PointCollection.prototype.addPoint=function(street_n_number){
    /*
    Agrega GCPoint al arreglo de puntos a geocodificar 
    */
    var point=new GCPoint(street_n_number);
    this.points.push(point);
};

PointCollection.prototype.geocode=function(){
    /*
    Recorre los puntos a geocodificar. 
    Si no pasan el normalizador de direcciones
    (direccion mal escrita) los saca de la lista
    */
    var cp=this;
    if(!cp.geocoding){
        cp.geocoding=true;
        if(cp.norm_ready){
            var remove_points = Array();
            for(var i=0;i<cp.points.length;i++){
                if(cp.points[i].geocode()===null){
                  remove_points.push(i);
                }
            }
            for(var j=0;j<remove_points.length;j++){
              cp.points.splice(remove_points[j], 1);
            }
        }
    }
};


function GCPoint(street_n_number){
    /*
    Wrapper class para facilitar la creacion de un punto geometrico 
    a partir de un string.
    */
    this.id=street_n_number;
    this.pt=null;
    this.geocoded=false;
    this.street=street_n_number;
    if(GCPoint.gc===undefined){
        GCPoint.gc=new usig.GeoCoder();
    }
}
GCPoint.prototype.geocode=function(){
  /*
  Lanza geocodificacion del punto y si no pasa el normalizador de 
  direcciones retorna null
  */
  var cp=this;
  try{
    direccion=usig.NormalizadorDirecciones.normalizar(cp.street,1)[0];
    cp.id=cp.street;
    GCPoint.gc.geoCodificarDireccion(
        direccion,
        function(response){
            if(response instanceof usig.Punto){
                cp.pt=response;
                cp.geocoded=true;
                jQuery("body").trigger('point-geocoded',[]);
            }else{
              console.log(cp.id+" "+response);
            }
        },
        function(error){
          console.log(error);
        }
    );
    return cp;
  }catch(err){
    return null;
  }
};