/* =========================================================
   幕间 MIJIAN · 角色形象与音色设定
   形象由「轮廓 / 服装 / 特征 / 色彩」构成；
   音色由「音质 / 音高 / 语速 / 咬字 / 参考方向」构成。
   stats 仅用于界面可视化与系统语音试听，不是选角结论。
   ========================================================= */

const CHARACTER_DESIGNS = {
  breath: {
    林见夏: {
      ageLook: '34 岁。清瘦，肩背却挺得很直，像一根被水压反复校准过的钢尺。',
      silhouette: '窄肩、长颈，深灰连体工装，左前臂固定着外骨骼支架，走路时几乎听不见声音。',
      wardrobe: '深灰工装 + 半旧橙色应急绳；袖口卷起，露出右腕一道浅白色旧伤。',
      features: '短黑发被水汽打湿，眼下有长期失眠的阴影；右手食指有旧伤，紧张时会用拇指反复摩擦。',
      keywords: ['克制', '水下感', '旧伤'],
      palette: ['#0b3b3c', '#9ddfcc', '#f1c386'],
      voice: {
        timbre: '低而干净的中性音，像隔着一层水说话。',
        pitch: '偏低。句尾下沉，很少上扬。',
        pace: '冷静、克制；越接近危机，语速反而越慢。',
        texture: '轻微气声，情绪上来时带一点颗粒感。',
        reference: '冷感文艺片女声，不要甜，不要播音腔。',
        stats: { pitch: 30, pace: 30, warmth: 38 }
      }
    },
    沈砚: {
      ageLook: '36 岁。宽肩，骨架大，身体像被海水泡过很多年，沉而稳。',
      silhouette: '旧潜水服把肩线撑得很宽，站姿微微前倾，像随时准备替人挡住什么。',
      wardrobe: '磨损的深蓝潜水服，右臂绑着褪色的救援绳；左手手套缺了一截。',
      features: '左眉骨有一道旧疤，胡茬没刮干净；笑起来时眼角的纹路比实际年龄深。',
      keywords: ['旧海', '保护欲', '疲惫'],
      palette: ['#0a1128', '#8fb5ff', '#c98d5a'],
      voice: {
        timbre: '低、哑，像从很远的水下传来。',
        pitch: '低。气息比声音更先到。',
        pace: '慢，停顿长；越认真越轻。',
        texture: '沙哑、有海底杂音般的粗粝感。',
        reference: '低频男声，不要浑厚英雄腔，保留疲惫。',
        stats: { pitch: 22, pace: 25, warmth: 52 }
      }
    }
  },

  echo: {
    林小满: {
      ageLook: '26 岁。圆脸，眼睛很大，看起来比实际年龄小几岁。',
      silhouette: '微驼背，宽大的米色卫衣把身体藏起来；总挂着有线耳机。',
      wardrobe: '米色卫衣 + 深蓝外套，袖口长到盖住手指；帆布包上别着一枚旧胸针。',
      features: '长发松松扎起，总有几缕垂在脸侧；右手腕上套着一根母亲的旧皮筋。',
      keywords: ['恋旧', '柔软', '没长大'],
      palette: ['#182651', '#8fb5ff', '#f2b7be'],
      voice: {
        timbre: '清亮、偏薄的年轻女声。',
        pitch: '中等偏高，情绪一紧会变轻。',
        pace: '平时偏快，说到母亲时会突然慢下来。',
        texture: '干净，偶尔有鼻音；哭的时候先失声。',
        reference: '生活化的年轻女声，不要偶像剧甜音。',
        stats: { pitch: 58, pace: 50, warmth: 66 }
      }
    },
    周岚: {
      ageLook: '55 岁。短发，身形温和，站在人群里不显眼。',
      silhouette: '圆肩，针织开衫，走路时手习惯性扶着包带，像随时准备照顾谁。',
      wardrobe: '浅灰针织开衫 + 深色长裙，珍珠耳钉；衣服总是干净、平整。',
      features: '笑起来有很深的法令纹；左手无名指有一道被戒指磨出的浅痕。',
      keywords: ['温柔', '隐藏', '旧照片'],
      palette: ['#3a2d20', '#e8d1a7', '#f2b7be'],
      voice: {
        timbre: '温暖的中音，有一点旧磁带般的柔焦感。',
        pitch: '中等偏低，句尾习惯性放软。',
        pace: '慢，像在哄人；说到自己时会含糊。',
        texture: '轻沙、温厚，录音里带一点底噪。',
        reference: '母亲式的温柔中音，但不要完美无缺。',
        stats: { pitch: 45, pace: 42, warmth: 78 }
      }
    }
  },

  paper: {
    阿萤: {
      ageLook: '12 岁。瘦小，手脚却很长，像还没长开的纸人。',
      silhouette: '齐耳短发，靛蓝棉袄，背一个洗得发白的布书包；站着时总缩着肩。',
      wardrobe: '靛蓝棉袄 + 深色棉裤，袖口沾着浆糊和金箔；手指上有纸割的小口子。',
      features: '眼睛很亮，生气时反而更亮；耳朵尖被冻得发红。',
      keywords: ['纸感', '倔强', '未长成'],
      palette: ['#1a1712', '#e8d1a7', '#c65f45'],
      voice: {
        timbre: '清脆、偏薄的少女声，像纸片划过桌面。',
        pitch: '高，但不尖；受委屈时会压低声。',
        pace: '快，句子短；生气时像连珠炮。',
        texture: '干净、略干，带一点孩子气的沙。',
        reference: '12 岁女孩，不要奶音，要有主见。',
        stats: { pitch: 78, pace: 62, warmth: 52 }
      }
    },
    陈守拙: {
      ageLook: '46 岁。背微驼，手很大，指节粗。',
      silhouette: '灰布衫外罩旧围裙，肩膀一高一低；坐着时像一张折过很多次的纸。',
      wardrobe: '灰布衫 + 深褐围裙，腰间挂着剪刀和麻绳；指甲缝里有洗不掉的金粉。',
      features: '眉毛粗，眉间有深竖纹；很少笑，笑起来像在咳嗽。',
      keywords: ['旧手艺', '沉默', '体面'],
      palette: ['#3a2d20', '#e8d1a7', '#9f5b42'],
      voice: {
        timbre: '干、低，像纸张摩擦。',
        pitch: '偏低，声音压在喉咙里。',
        pace: '很慢，常停下来清嗓子。',
        texture: '粗粝、干燥，句尾有烟熏感。',
        reference: '旧式手艺人，不要煽情，越平常越重。',
        stats: { pitch: 25, pace: 28, warmth: 55 }
      }
    }
  },

  radio: {
    周野: {
      ageLook: '35 岁。瘦高，肩线松，像长期坐在话筒前的人。',
      silhouette: '黑衬衫，袖子挽到手肘，耳机挂在脖子上；站着时重心总落在一条腿上。',
      wardrobe: '黑色衬衫 + 深灰长裤，领口松开；手腕上戴一块旧表。',
      features: '眼下发青，嘴角有一点习惯性的笑；手指修长，常无意识敲桌面。',
      keywords: ['声音动物', '表演欲', '失眠'],
      palette: ['#3a161b', '#ff6673', '#c8b6ff'],
      voice: {
        timbre: '低而亮的电台嗓，自带一点混响。',
        pitch: '偏低，但会故意往上挑。',
        pace: '从容，擅长用停顿制造气氛。',
        texture: '圆润、贴麦，笑起来有气声。',
        reference: '深夜电台主持人，不要油滑，保留疲惫。',
        stats: { pitch: 35, pace: 45, warmth: 38 }
      }
    },
    顾青: {
      ageLook: '32 岁。利落，肩背笔直，站着时像随时要出警。',
      silhouette: '深色风衣，短发别在耳后；手插口袋，重心稳。',
      wardrobe: '深灰衬衫 + 黑风衣，没有任何多余装饰；鞋跟磨损但不脏。',
      features: '目光很直，很少眨眼；左眉尾有一道细疤，说话时会微微挑眉。',
      keywords: ['边界感', '锐利', '旧友'],
      palette: ['#1a1712', '#c8b6ff', '#8a8f9c'],
      voice: {
        timbre: '冷、干净的中音，有一点金属感。',
        pitch: '中等，句尾利落。',
        pace: '偏快，信息密度高。',
        texture: '清晰、少气声，像对讲机里的声音。',
        reference: '干练女警，不要冷到没有温度。',
        stats: { pitch: 50, pace: 54, warmth: 32 }
      }
    }
  },

  lost: {
    陈默: {
      ageLook: '29 岁。清瘦，微卷发，看起来像刚毕业没几年。',
      silhouette: '旧毛衣，帆布包斜挎，肩有点塌；手总插在口袋里。',
      wardrobe: '深棕旧毛衣 + 洗白的牛仔裤，帆布包上沾着颜料；口袋里有一截铅笔。',
      features: '手指常有铅笔灰，眼睛下方有淡淡黑眼圈；被问到过去时会先笑一下。',
      keywords: ['退让', '未完成', '手绘感'],
      palette: ['#4a3421', '#f0c17c', '#9db3a4'],
      voice: {
        timbre: '温和、偏软的男声。',
        pitch: '中等偏低，句尾常含住。',
        pace: '偏慢，容易停顿，像在斟酌。',
        texture: '轻气声，带一点不确定的笑。',
        reference: '温柔但不自信的普通人，不要配音腔。',
        stats: { pitch: 42, pace: 35, warmth: 62 }
      }
    },
    周奶奶: {
      ageLook: '72 岁。小个子，背微微驼，银发盘成髻。',
      silhouette: '深蓝布衫，手背有老年斑，拄一根旧木拐；站着时像一棵老树。',
      wardrobe: '深蓝布衫 + 黑色布鞋，衣襟上别着一枚旧胸针；手腕上戴一只老式手表。',
      features: '眼睛很亮，眼角纹路深；说话时习惯先抿一下嘴。',
      keywords: ['体面', '旧时代', '余勇'],
      palette: ['#21180f', '#9db3a4', '#e8d1a7'],
      voice: {
        timbre: '沙哑、温厚的老太太声。',
        pitch: '中等偏高，尾音有点颤。',
        pace: '慢，但字字清楚。',
        texture: '干燥、沙沙的，笑起来有痰音。',
        reference: '有分寸的江南老太太，不要卡通化。',
        stats: { pitch: 55, pace: 30, warmth: 72 }
      }
    }
  },

  store: {
    许放: {
      ageLook: '25 岁。少年感还在，头发有点乱，像刚睡醒。',
      silhouette: '便利店制服穿得松松垮垮，袖子挽起；站没站相，但笑起来很干净。',
      wardrobe: '深绿便利店马甲 + 白 T 恤，工牌歪着；口袋里有一支圆珠笔。',
      features: '黑眼圈，嘴角有一点干皮；左手虎口有一道被货架划的浅伤。',
      keywords: ['日常感', '松弛', '没说完'],
      palette: ['#17343a', '#75d8ce', '#ef8f9e'],
      voice: {
        timbre: '年轻、随意，带一点鼻音。',
        pitch: '中等，偶尔破音。',
        pace: '偏快，喜欢用玩笑带过。',
        texture: '松、软，深夜会变哑。',
        reference: '夜班店员，不要播音腔，要像在跟熟人说话。',
        stats: { pitch: 52, pace: 50, warmth: 62 }
      }
    },
    夏遥: {
      ageLook: '24 岁。清冷，脸小，中长发总别在耳后。',
      silhouette: '米白外套，肩上背一个很重的帆布包；站着时习惯抱臂。',
      wardrobe: '米白外套 + 浅蓝衬衫，透明伞；手腕上戴一根红绳。',
      features: '眼睛很亮，但很少直视人；说话时会把下巴收进围巾。',
      keywords: ['透明感', '防备', '雨'],
      palette: ['#17343a', '#ef8f9e', '#dbeafe'],
      voice: {
        timbre: '轻、干净，有点冷。',
        pitch: '偏高，句尾轻轻收住。',
        pace: '快，像怕被追问。',
        texture: '气声多，笑起来很短。',
        reference: '克制的年轻女声，不要甜，保留距离。',
        stats: { pitch: 62, pace: 58, warmth: 44 }
      }
    }
  },

  extra: {
    马小跃: {
      ageLook: '31 岁。干瘦，脸长，表情丰富得像橡皮。',
      silhouette: '军大衣、皱 T 恤，走路外八字；站着时总在找镜头。',
      wardrobe: '皱 T 恤 + 剧组军大衣，裤脚沾泥；腰上挂着装盒饭的塑料袋。',
      features: '脸上常带没擦净的假血，眼角有笑纹；右手总在比划。',
      keywords: ['弹性', '小人物', '自嘲'],
      palette: ['#3c2f18', '#f6c96a', '#c76b57'],
      voice: {
        timbre: '亮、活，带一点夸张的鼻音。',
        pitch: '中等偏高，能突然拔高。',
        pace: '快，节奏感强，像在抖包袱。',
        texture: '松脆、会破音，认真时突然变低。',
        reference: '横店群演，不要小品腔，要有生活。',
        stats: { pitch: 58, pace: 66, warmth: 58 }
      }
    },
    小乔: {
      ageLook: '27 岁。利落，短发，棒球帽压得很低。',
      silhouette: '工装裤、对讲机，走路带风；站着时一只手总插在口袋里。',
      wardrobe: '黑色工装裤 + 深色卫衣，脖子上挂对讲机；腰包里有场记笔。',
      features: '眼睛亮，笑起来有一点狡黠；左手腕有一道被器材划的旧伤。',
      keywords: ['利落', '现场感', '不肯认输'],
      palette: ['#1c1811', '#c76b57', '#f6c96a'],
      voice: {
        timbre: '亮、直接，像现场喊话。',
        pitch: '中等偏高，句尾干脆。',
        pace: '快，句子短。',
        texture: '清晰、带一点沙，笑起来很爽。',
        reference: '女场务，不要嗲，要有行动力。',
        stats: { pitch: 65, pace: 62, warmth: 50 }
      }
    }
  },

  moon: {
    小满: {
      ageLook: '8 岁。小个子，齐刘海，眼睛很大。',
      silhouette: '黄色雨衣，书包上挂着月亮挂件；站着时习惯把书包抱在胸前。',
      wardrobe: '黄色雨衣 + 红色小雨靴，里面是校服；口袋里装着半块橡皮。',
      features: '脸上有雨水，睫毛很长；受委屈时会抿住嘴，不让自己哭。',
      keywords: ['潮湿', '孩子气', '认真'],
      palette: ['#25334e', '#dbe9ff', '#e9b49e'],
      voice: {
        timbre: '清亮、薄，像小铃铛。',
        pitch: '高，但不尖。',
        pace: '慢，认真；着急时会结巴。',
        texture: '干净、带一点鼻音。',
        reference: '8 岁女孩，不要奶声奶气，要像真的在想事情。',
        stats: { pitch: 84, pace: 55, warmth: 76 }
      }
    },
    陈建国: {
      ageLook: '38 岁。壮实，肩膀厚，脸被风吹得有点糙。',
      silhouette: '出租车司机夹克，肩宽，站着时习惯把双手插在口袋里。',
      wardrobe: '深蓝夹克 + 灰色针织衫，车钥匙挂在腰间；衣领有一点磨损。',
      features: '胡茬，眼角有细纹；手很粗，指甲修得很短。',
      keywords: ['粗糙', '笨拙', '可靠'],
      palette: ['#0e1524', '#e9b49e', '#8fa3bf'],
      voice: {
        timbre: '低、厚，有一点砂纸感。',
        pitch: '偏低，句尾常往下掉。',
        pace: '慢，不太会说长句。',
        texture: '粗、干，对女儿说话时会突然变软。',
        reference: '普通中年司机，不要英雄腔，要笨拙的温柔。',
        stats: { pitch: 26, pace: 36, warmth: 66 }
      }
    }
  }
};

IDEAS.forEach((idea) => {
  const designs = CHARACTER_DESIGNS[idea.id] || {};
  idea.characters.forEach((character) => {
    character.design = designs[character.name] || {
      ageLook: '年龄与外形待定。',
      silhouette: '轮廓待定。',
      wardrobe: '服装待定。',
      features: '特征待定。',
      keywords: ['待定'],
      palette: [idea.palette.bg1, idea.palette.accent, idea.palette.warm],
      voice: {
        timbre: '音色待定。',
        pitch: '音高待定。',
        pace: '语速待定。',
        texture: '质感待定。',
        reference: '参考方向待定。',
        stats: { pitch: 50, pace: 50, warmth: 50 }
      }
    };
  });
});
