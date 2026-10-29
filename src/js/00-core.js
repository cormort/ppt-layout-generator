
const LSKEY='layoutGen2',OLDLKEY='layoutGen';
/* 畫布尺寸跟著整份簡報的「版面尺寸」走；renderSVG 每次都會依 S.ratio 設定 */
const RATIOS={'16:9':[1920,1080],'1:1':[1080,1080],'4:5':[1080,1350],'3:4':[1080,1440],'9:16':[1080,1920]};
/* 版型支援的尺寸：ALLR＝任何尺寸（圖表、對比、照片牆），CARDR＝圖卡尺寸 */
const ALLR=['16:9','1:1','4:5','3:4','9:16'],CARDR=['1:1','4:5','3:4','9:16'];
let W=1920,H=1080;
const FONTS=[
 ["微軟正黑體","'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif"],
 ["標楷體","'DFKai-SB','BiauKai','KaiTi','STKaiti',serif"],
 ["新細明體","'PMingLiU','MingLiU','Songti TC',serif"],
 ["思源宋體 / Noto Serif","'Noto Serif TC','Source Han Serif TC','Noto Serif CJK TC','Songti TC',serif"],
 ["微軟雅黑","'Microsoft YaHei','PingFang SC',sans-serif"],
 ["Georgia（英文襯線）","Georgia,'Times New Roman','PMingLiU',serif"],
 ["Arial Black（英文粗體）","'Arial Black','Arial','Microsoft JhengHei',sans-serif"]];
const SWATCH=['#2f5d8a','#3f6b3a','#7a8f4e','#c2456b','#d9822b','#8a5a2b','#5b4b8a','#1f7a7a','#b03a2e','#3a3a3a'];
const BGS=[['白','#ffffff'],['米白','#f7f3ea'],['淺灰','#f1f2f4'],['暖灰','#e9e4dc'],['淡藍','#eef3f9'],['深藍','#14233a'],['炭黑','#1e1f22']];
const DEF={title:'預算編製作業說明',subtitle:'行政院主計總處 · ○○處',body:'依中央總預算編製作業規定，各機關應於期限內完成概算編報，逾期不予受理。',items:'編報流程|Process\n審查重點|Review\n常見缺失|Issues\n時程管制|Timeline',number:'01',color:'#2f5d8a',accent:'#c9a24a',tf:0,bf:0,single:false,tpl:'cFrame',
  bgOn:false,bg:'#f7f3ea',company:'',date:'',page:'',footer:false,logo:'',logoAR:1,logoPos:'tr',logoBg:true,logoSize:70,
  focal:'xMidYMid',theme:'auto',cat:'fit',fmt:'png',scale:2,fname:'',fs:100,notes:'',pages:[],cur:0,pptText:'edit',pptQ:'std',ratio:'16:9',secSync:true,bullet:''};
const BIZ=[['藏青金','#1f3a5f','#c9a24a'],['商務藍','#1d5fa8','#38b2e8'],['深灰橘','#3b3f46','#f08a24'],['墨綠米','#2f5a46','#d8b98a'],['酒紅灰','#7a2635','#a8a8a8'],['科技紫','#3b2f8f','#22c3c3']];
const FOCAL=['xMinYMin','xMidYMin','xMaxYMin','xMinYMid','xMidYMid','xMaxYMid','xMinYMax','xMidYMax','xMaxYMax'];
const CATS=[['fit','建議'],['all','全部'],['cover','封面／標題'],['text','文字頁'],['chart','圖表'],['map','地圖'],['card','圖卡'],['cmp','對比'],['wall','照片牆'],['mag','雜誌風'],['shape','形狀拼貼'],['sec','章節頁'],['toc','目錄'],['grid','圖文分格'],['biz','商務'],['cn','中國風']];

