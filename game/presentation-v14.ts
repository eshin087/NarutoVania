export const MIRROR_SIZE = {width:130,height:230,interiorWidth:100,interiorHeight:180,reflectionHeight:146};
export function dialogueDuration(text:string){return Math.max(2500,Math.min(5500,700+text.trim().split(/\s+/).length*260));}
export function flowFrame(age:number,life:number,travel=true){
  if(age<180)return Math.min(3,Math.floor(age/45));
  if(!travel||age>life-240)return 12+Math.min(3,Math.floor(Math.max(0,age-(life-240))/60));
  return 4+Math.floor((age-180)/65)%8;
}
export function mirrorFeet(y:number,floor:number){return Math.min(floor,y+73);}
export const ULTIMATE_END=2000;
