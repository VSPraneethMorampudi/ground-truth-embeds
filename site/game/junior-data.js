/* Short, bilingual instructions. Pictures and matching targets carry the task. */
export const T=(en,hi)=>({en,hi});
export const THINGS={
 school:{label:T('School','स्कूल'),color:'#407be5',at:[81.63,21.25]},
 hospital:{label:T('Hospital','अस्पताल'),color:'#e85d69',at:[82.15,22.08]},
 tree:{label:T('Trees','पेड़'),color:'#3d9569',at:[81.96,19.07]},
 road:{label:T('Road','सड़क'),color:'#c37c49'},
 river:{label:T('River','नदी'),color:'#2d9bd9'},
 map:{label:T('My map','मेरा नक्शा'),color:'#ec9d35'},
 pin:{label:T('School pin','स्कूल का निशान'),color:'#407be5'},
 newSchool:{label:T('New school','नया स्कूल'),color:'#9163cf',at:[81.49,20.27]},
 sky:{label:T('Sky blue','आसमानी नीला'),color:'#42b4e6'},
 deep:{label:T('Deep blue','गहरा नीला'),color:'#2879cf'},
 sea:{label:T('Sea blue','समुद्री नीला'),color:'#249cb9'}
};
export const MISSIONS=[
 {id:'find',name:T('Find','ढूँढो'),title:T('Find two places','दो जगहें ढूँढो'),task:T('Move the school and hospital into the map box.','स्कूल और अस्पताल को नक्शे वाले डिब्बे में रखो।'),learn:T('A map shows where places are.','नक्शा बताता है कि कौन-सी जगह कहाँ है।'),cards:['school','hospital'],targets:[{id:'basket',picture:'map',label:T('Map box','नक्शे का डिब्बा'),accept:['school','hospital']}],win:T('Two places! Your map is growing.','दो जगहें! तुम्हारा नक्शा बन रहा है।')},
 {id:'match',name:T('Match','मिलाओ'),title:T('Match the pictures','तस्वीरें मिलाओ'),task:T('Put each picture in its matching box.','हर तस्वीर को उसी तस्वीर वाले डिब्बे में रखो।'),learn:T('Matching pictures make a map easy to read.','एक जैसे निशानों से नक्शा पढ़ना आसान होता है।'),cards:['school','hospital','tree','road'],targets:['school','hospital','tree','road'].map(id=>({id,picture:id,label:THINGS[id].label,accept:[id]})),win:T('All matched! You know the map pictures.','सब मिल गए! तुम नक्शे के निशान जानते हो।')},
 {id:'place',name:T('Place','जगह'),title:T('Where is the school?','स्कूल कहाँ है?'),task:T('Move the school pin onto the big star.','स्कूल के निशान को बड़े तारे पर रखो।'),learn:T('A pin marks a place on a map.','निशान नक्शे पर किसी जगह को दिखाता है।'),cards:['pin'],at:[81.63,21.25],targets:[{id:'star',picture:'star',label:T('Put it here','यहाँ रखो'),accept:['pin']}],win:T('There it is! The school has a place.','मिल गया! स्कूल सही जगह पर है।')},
 {id:'layers',name:T('Add','जोड़ो'),title:T('Add trees and a river','पेड़ और नदी जोड़ो'),task:T('Move both pictures into the map box.','दोनों तस्वीरों को नक्शे वाले डिब्बे में रखो।'),learn:T('Maps can show nature, too.','नक्शे पर पेड़ और नदियाँ भी दिखते हैं।'),cards:['tree','river'],targets:[{id:'basket',picture:'map',label:T('Map box','नक्शे का डिब्बा'),accept:['tree','river']}],win:T('Green trees. A flowing river. A busy map!','हरे पेड़ और बहती नदी! नक्शे में रंग आ गए।')},
 {id:'friends',name:T('Share','दिखाओ'),title:T('Help two friends','दो दोस्तों की मदद करो'),task:T('Give a map to each friend.','दोनों दोस्तों को एक-एक नक्शा दो।'),learn:T('A map helps friends find their way.','नक्शा दोस्तों को रास्ता ढूँढने में मदद करता है।'),cards:['map'],repeat:true,targets:[{id:'friend-a',picture:'friend',label:T('Friend 1','दोस्त 1'),accept:['map']},{id:'friend-b',picture:'friend',label:T('Friend 2','दोस्त 2'),accept:['map']}],win:T('Both friends can find their way now.','अब दोनों दोस्त रास्ता ढूँढ सकते हैं।')},
 {id:'new',name:T('Explore','घूमो'),title:T('A new school!','एक नया स्कूल!'),task:T('Move the new school onto the big star.','नए स्कूल को बड़े तारे पर रखो।'),learn:T('New places can be added to a map.','नई जगहों को नक्शे में जोड़ सकते हैं।'),cards:['newSchool'],at:[81.49,20.27],targets:[{id:'star',picture:'star',label:T('New school goes here','नया स्कूल यहाँ रखो'),accept:['newSchool']}],win:T('A new school is on your map!','तुम्हारे नक्शे में नया स्कूल आ गया!')},
 {id:'color',name:T('Color','रंग'),title:T('Pick a river blue','नदी के लिए नीला चुनो'),task:T('Choose a blue paint pot. Move it to the river.','नीला रंग चुनकर नदी पर रखो।'),learn:T('Blue lines on a map can show rivers.','नक्शे पर नीली रेखाएँ नदियाँ दिखा सकती हैं।'),cards:['sky','deep','sea'],chooseOne:true,targets:[{id:'water',picture:'river',label:T('Paint the river','नदी को रंगो'),accept:['sky','deep','sea']}],win:T('Lovely blue! The river is easy to see.','प्यारा नीला रंग! अब नदी साफ़ दिखती है।')},
 {id:'save',name:T('Keep','सहेजो'),title:T('Keep your map safe','अपना नक्शा सँभालो'),task:T('Move your map into the treasure chest.','अपना नक्शा खज़ाने के डिब्बे में रखो।'),learn:T('Saving keeps a map for another day.','सहेजने से नक्शा बाद में भी मिलता है।'),cards:['map'],targets:[{id:'chest',picture:'chest',label:T('Treasure chest','खज़ाने का डिब्बा'),accept:['map']}],win:T('You did it! You are a Map Explorer.','तुमने कर दिखाया! तुम नक्शा खोजी हो।')}
];

export function picture(name){
 const paths={
 school:'<path d="M8 30 32 11l24 19" fill="#fac55a"/><path d="M14 29h36v28H14z" fill="#78a8fa"/><path d="M27 41h10v16H27z" fill="#284b8a"/><path d="M19 35h6v7h-6zm20 0h6v7h-6z" fill="white"/><path d="M32 12V5l12 4-12 4" fill="#ed6860"/>',
 hospital:'<rect x="12" y="15" width="40" height="43" rx="5" fill="#f1939a"/><path d="M27 21h10v7h7v10h-7v7H27v-7h-7V28h7z" fill="white"/><path d="M27 49h10v9H27z" fill="#8d4354"/>',
 tree:'<path d="M28 36h8v23h-8z" fill="#b57b4d"/><circle cx="22" cy="28" r="16" fill="#6cb57e"/><circle cx="41" cy="28" r="16" fill="#419e66"/><circle cx="32" cy="17" r="15" fill="#7fc58d"/>',
 road:'<path d="M25 5h14l20 54H5z" fill="#727e91"/><path d="M31 9h2v9h-2zm-1 16h4v10h-4zm-1 18h6v12h-6z" fill="#fff3bd"/>',
 river:'<path d="M10 8c45-7 45 18 12 24s-8 18 29 18" stroke="#45b4e8" stroke-width="14" fill="none" stroke-linecap="round"/><path d="m42 41 13 9-14 7" fill="none" stroke="#227cac" stroke-width="3"/>',
 map:'<path d="m5 15 18-6 18 7 18-6v40l-18 6-18-7-18 6z" fill="#f9df91"/><path d="M23 10v39m18-33v39" stroke="#d7ac58" stroke-width="2"/><path d="m13 39 14-14 12 10 12-11" fill="none" stroke="#75a46a" stroke-width="4"/><circle cx="35" cy="27" r="8" fill="#ee7c65"/><circle cx="35" cy="26" r="3" fill="white"/>',
 pin:'<path d="M32 59S12 36 12 23a20 20 0 1 1 40 0c0 13-20 36-20 36z" fill="#5b92ef"/><circle cx="32" cy="23" r="10" fill="white"/><path d="m26 24 6-6 6 6v8H26z" fill="#4875ba"/>',
 newSchool:'<path d="M8 30 32 11l24 19" fill="#ffd063"/><path d="M14 29h36v28H14z" fill="#a28ade"/><path d="M27 41h10v16H27z" fill="#634795"/><path d="M19 35h6v7h-6zm20 0h6v7h-6z" fill="white"/><path d="m49 4 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#f1ae35"/>',
 star:'<path d="m32 4 8 18 20 2-15 14 4 21-17-10-18 10 4-21L3 24l21-2z" fill="#ffd45c" stroke="#d79c2f" stroke-width="2"/>',
 friend:'<circle cx="32" cy="23" r="16" fill="#c58d64"/><path d="M16 22c0-22 33-23 33 1-7-2-12-7-14-12-5 7-10 9-19 11" fill="#363237"/><path d="M9 61c0-25 46-25 46 0" fill="#7892d7"/><path d="M26 28q6 6 12 0" fill="none" stroke="#784a38" stroke-width="2.5" stroke-linecap="round"/>',
 chest:'<path d="M7 30h50v27H7z" fill="#bf884c"/><path d="M7 29C7 2 57 2 57 29z" fill="#e3b46f"/><path d="M17 11v46m30-46v46" stroke="#f5d275" stroke-width="5"/><path d="M7 30h50" stroke="#815c38" stroke-width="4"/><rect x="27" y="27" width="10" height="14" rx="2" fill="#f6d86d"/>'
 };
 if(['sky','deep','sea'].includes(name))return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 24h36l-4 34H18z" fill="${THINGS[name].color}"/><ellipse cx="32" cy="24" rx="18" ry="7" fill="#e5f3ff"/><ellipse cx="32" cy="25" rx="14" ry="4" fill="${THINGS[name].color}"/><path d="M18 24c0-26 28-26 28 0" stroke="#7b8595" stroke-width="4" fill="none"/></svg>`;
 return `<svg viewBox="0 0 64 64" aria-hidden="true">${paths[name]||paths.map}</svg>`;
}
export const BUDDY='<svg viewBox="0 0 80 90" aria-hidden="true"><path d="M40 86S9 53 9 33a31 31 0 1 1 62 0c0 20-31 53-31 53" fill="#ed8265"/><circle cx="40" cy="32" r="22" fill="#fff9e9"/><circle cx="32" cy="29" r="3" fill="#344354"/><circle cx="48" cy="29" r="3" fill="#344354"/><path d="M31 40q9 9 18 0" stroke="#344354" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="23" cy="37" r="4" fill="#f3b6a2"/><circle cx="57" cy="37" r="4" fill="#f3b6a2"/></svg>';
