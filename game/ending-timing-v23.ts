const lerp=(a:number,b:number,t:number)=>a+(b-a)*Math.max(0,Math.min(1,t));
/** Haku arrives 50ms before the thrust; the hand stays 95px short of Zabuza. */
export function interceptionPositions(age:number,kakashiX:number,zabuzaX:number,hakuX:number){const stop=zabuzaX-155,contactX=stop+60;return{kakashiX:lerp(kakashiX,stop,(age-6300)/850),hakuX:lerp(hakuX,contactX,(age-6100)/1000),contactX,contact:age>=7150};}
