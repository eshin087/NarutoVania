import type {CinemaClip} from './story-director';
export function rescueScene():CinemaClip{return{id:'transformed-shuriken',authored:true,arena:'lakeside',duration:10500,actors:[
 {id:'naruto',x:410,y:592,facing:1,animation:'idle'},{id:'sasuke',x:535,y:592,facing:1,animation:'idle'},
 {id:'zabuza',x:1040,y:592,facing:-1,animation:'cast'},{id:'prisoner',x:1160,y:545,facing:-1,animation:'guardbreak'}],cues:[
 {at:0,camera:0,zoom:.84,actor:'prisoner',effect:'prison'},
 {at:200,actor:'naruto',speech:'Sasuke! Use the shuriken in its shadow.'},
 {at:600,motion:'teamwork'},
 {at:3650,actor:'sasuke',speech:'Now, Naruto!'},
 {at:7500,actor:'prisoner',speech:'You freed me. Leave the rest to me.'}
 ]};}
export function snowScene():CinemaClip{return{id:'snowy-rest',authored:true,arena:'bridge',duration:14200,actors:[
 {id:'haku',x:1100,y:590,facing:-1,animation:'defeat'},{id:'zabuza',x:1450,y:590,facing:-1,animation:'guardbreak'},
 {id:'kakashi',x:930,y:590,facing:1,animation:'idle'},{id:'naruto',x:830,y:590,facing:1,animation:'idle'},
 {id:'sasuke',x:350,y:590,facing:1,animation:'defeat'},{id:'sakura',x:440,y:590,facing:-1,animation:'guardbreak'}],cues:[
 {at:0,camera:360,zoom:.95,fade:'in',effect:'snow'},
 {at:200,actor:'zabuza',speech:'Kakashi… take me to Haku.'},
 {at:900,motion:'snow-carry'},
 {at:10100,actor:'zabuza',speech:'Let me rest beside you, Haku.'}
 ]};}
