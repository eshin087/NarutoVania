/** Effects born during an update stay owned, but start updating on the next tick. */
export class OwnedEffects<T> {
  private active:T[]=[];
  private pending:T[]=[];
  private updating=false;
  constructor(private limit:number,private dispose:(item:T)=>void){}
  get items(){return [...this.active,...this.pending];}
  add(item:T){if(this.updating)this.pending.push(item);else{this.active.push(item);this.trim();}return item;}
  private trim(){while(this.active.length>this.limit)this.dispose(this.active.shift()!);}
  update(alive:(item:T)=>boolean){
    this.updating=true;const survivors:T[]=[];
    try{for(const item of this.active){if(alive(item))survivors.push(item);else this.dispose(item);}}
    finally{this.active=[...survivors,...this.pending];this.pending=[];this.updating=false;this.trim();}
  }
  clear(){for(const item of this.items)this.dispose(item);this.active=[];this.pending=[];}
}

/** Distinct emissions count once, regardless of the number of firing mirrors. */
export class MirrorDeflections {
  generation=0;
  private volleys=new Set<string>();
  get count(){return Math.min(2,this.volleys.size);}
  reset(){this.generation++;this.volleys.clear();}
  contact(generation:number,volley:string){
    if(generation!==this.generation||this.volleys.has(volley))return {credited:false,knockdown:false};
    this.volleys.add(volley);return {credited:true,knockdown:this.count>=2};
  }
}
