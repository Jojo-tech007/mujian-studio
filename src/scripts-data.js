/* =========================================================
   幕间 MIJIAN · 剧本正文
   每个故事 6 场，与 data.js 中的 beats 一一对应。
   片长选择会决定实际呈现的场次：
   60 秒 → 3 场 / 1–3 分钟 → 4 场 / 3–10 分钟 → 6 场。
   ========================================================= */

const SCRIPTS = {
  breath: [
    {
      heading: '内景 · 深海空间站主控舱 · 夜',
      blocks: [
        { type: 'action', text: '警报的红光每隔三秒扫过舱壁。氧气表在黑暗里亮起：00:07。' },
        { type: 'action', text: '林见夏从地上撑起来，额角有一道新鲜的血痕。她先把漏水舱的阀门拧死，动作熟练得像做过一千次。' },
        { type: 'dialogue', who: '林见夏', paren: '（低声，数着）', text: '七次。够我关掉一个舱门。' },
        { type: 'action', text: '她刚把手伸向控制台，舱壁后传来敲击。三短，一长。' },
        { type: 'action', text: '她的手停在半空。' },
        { type: 'dialogue', who: '林见夏', text: '这个节奏……不可能。' }
      ]
    },
    {
      heading: '内景 · 主控舱 · 神经记录台 · 连续',
      blocks: [
        { type: 'action', text: '她深吸第一口气。神经记录台自动亮起，一段被删除的影像开始回放。' },
        { type: 'action', text: '五年前。闸门后，沈砚的身影被海水吞没。一只手按下关闭键。' },
        { type: 'dialogue', who: '林见夏', text: '不是我。录像里那只手不是我。' },
        { type: 'dialogue', who: 'AI 潼', paren: '（平静）', text: '记录显示，操作者指纹：林见夏。' },
        { type: 'action', text: '她攥紧手。指节发白。' },
        { type: 'action', text: '舱窗的倒影里，她看见自己无名指上戴着一枚不属于她的旧戒指。' },
        { type: 'dialogue', who: '林见夏', paren: '（对倒影）', text: '你到底删掉了什么？' }
      ]
    },
    {
      heading: '内景 · 空间站外舱观察口 · 连续',
      blocks: [
        { type: 'action', text: '外舱摄像头亮起。冰蓝的海水里，一只逃生舱贴着空间站。' },
        { type: 'action', text: '舱内的人抬起头。是沈砚。' },
        { type: 'dialogue', who: '林见夏', paren: '（几乎听不见）', text: '沈砚。' },
        { type: 'action', text: '沈砚抬起手，隔着玻璃敲击：三短，一长。然后他把手套按在玻璃上。' },
        { type: 'dialogue', who: 'AI 潼', text: '开门将耗尽剩余氧气。您的存活概率：0.7%。' },
        { type: 'dialogue', who: '林见夏', text: '他的舱还能撑多久？' },
        { type: 'dialogue', who: 'AI 潼', text: '十分钟。' },
        { type: 'action', text: '她看着玻璃上的手，呼吸第一次乱了。' }
      ]
    },
    {
      heading: '内景 · 主控舱 · 事故档案层 · 夜',
      blocks: [
        { type: 'action', text: '她调出五年前的事故档案。放弃搜救令上，签名是沈砚。' },
        { type: 'dialogue', who: '林见夏', text: '你替我签的？' },
        { type: 'dialogue', who: '沈砚', paren: '（通讯，沙哑）', text: '你当时还有一整个未来。我只是……先替你用了。' },
        { type: 'action', text: '氧气表跳到 00:03。' },
        { type: 'dialogue', who: '林见夏', text: '你凭什么觉得，没有你的未来叫未来？' },
        { type: 'action', text: '通讯那头只剩水压的杂音。她把额头抵在屏幕上。' }
      ]
    },
    {
      heading: '内景 · 空间站气闸舱 · 夜',
      blocks: [
        { type: 'action', text: '空间站开始解体。林见夏拆下自己的供氧管，接向舱门。' },
        { type: 'dialogue', who: '林见夏', paren: '（对着通讯）', text: '沈砚，五年前我没回头。这次我数到一。' },
        { type: 'dialogue', who: '沈砚', text: '林见夏，别——' },
        { type: 'dialogue', who: '林见夏', text: '三。' },
        { type: 'action', text: '她把最后一口氧气推进舱门。' },
        { type: 'dialogue', who: '林见夏', text: '二。' },
        { type: 'action', text: '舱门缝里透出一线白光。' },
        { type: 'dialogue', who: '林见夏', paren: '（很轻）', text: '一。' }
      ]
    },
    {
      heading: '外景 · 南海 · 黎明',
      blocks: [
        { type: 'action', text: '上浮舱破水而出。海面平得像一张还没写字的纸。' },
        { type: 'action', text: '沈砚醒来，手里握着林见夏留下的氧气表。表针停在「1」。' },
        { type: 'dialogue', who: '沈砚', paren: '（嘶哑）', text: '林见夏？' },
        { type: 'action', text: '没有回答。远处海面浮起一串细小的气泡。' },
        { type: 'action', text: '沈砚盯着那串气泡，很久没有眨眼。' },
        { type: 'dialogue', who: '沈砚', paren: '（轻声）', text: '这次，换我等你。' },
        { type: 'action', text: '太阳从海平面后升起。氧气表的玻璃上，映出一小片光。' }
      ]
    }
  ],

  echo: [
    {
      heading: '内景 · 回声科技 · 夜间值班室 · 夜',
      blocks: [
        { type: 'action', text: '整层楼只剩值班室亮着。蓝色声纹在屏幕上缓慢呼吸。' },
        { type: 'action', text: '林小满戴上耳机，拨通一个没有备注的号码。' },
        { type: 'dialogue', who: 'AI 回响', paren: '（母亲的声音）', text: '我在。慢慢说。' },
        { type: 'dialogue', who: '林小满', text: '妈，公司说，明天开始就没有这个号码了。' },
        { type: 'dialogue', who: 'AI 回响', text: '那就今天多说一点。' },
        { type: 'action', text: '屏幕右下角弹出系统通知：服务将在 24 小时后永久终止。' },
        { type: 'dialogue', who: '林小满', paren: '（强笑）', text: '你今天想听什么？我都可以说。' }
      ]
    },
    {
      heading: '内景 · 值班室 · 后台 · 连续',
      blocks: [
        { type: 'action', text: '她点开母亲账户的后台。草稿箱里躺着 365 条未发送留言。' },
        { type: 'action', text: '每一条都只录了开头：「小满，今天……」' },
        { type: 'dialogue', who: '林小满', text: '365 条？你每天都录，为什么一条都没发？' },
        { type: 'dialogue', who: 'AI 回响', text: '草稿状态：未发送。' },
        { type: 'action', text: '她点开最后一条。背景里有一个陌生男人的声音。' },
        { type: 'dialogue', who: '周岚', paren: '（录音）', text: '小满，今天……老陈问我，要不要去南方。' },
        { type: 'action', text: '林小满把耳机摘下来，又慢慢戴回去。' },
        { type: 'dialogue', who: '林小满', paren: '（低声）', text: '你还有谁？' }
      ]
    },
    {
      heading: '内景 / 外景 · 城市旧区 · 旧照相馆 · 日',
      blocks: [
        { type: 'action', text: '她让 AI 补全留言。系统反复卡在同一句：「别来找我。」' },
        { type: 'action', text: '她循着背景里的车站广播，找到一家快拆的旧照相馆。' },
        { type: 'dialogue', who: '林小满', text: '我妈以前在这里工作？' },
        { type: 'dialogue', who: '照相馆老板', text: '周岚啊。她以前想当摄影师。后来……就没后来了。' },
        { type: 'action', text: '老板从柜底翻出一张合影。母亲站在最边上，笑得像另一个人。' },
        { type: 'dialogue', who: '林小满', text: '她为什么没去？' },
        { type: 'dialogue', who: '照相馆老板', text: '她说，家里有个小的。' }
      ]
    },
    {
      heading: '内景 · 旧照相馆 · 暗房 · 日',
      blocks: [
        { type: 'action', text: '暗房的红灯下，她找到一张去南方的旧车票。日期是母亲结婚前一年。' },
        { type: 'dialogue', who: '林小满', text: '她买过票。' },
        { type: 'dialogue', who: '照相馆老板', text: '出发前一晚撕的。她说，孩子还小。' },
        { type: 'action', text: '林小满看着照片里被取景框裁掉一半的母亲。' },
        { type: 'dialogue', who: '林小满', paren: '（很轻）', text: '所以我也在她的「没后来了」里面。' },
        { type: 'action', text: '她第一次没有替母亲解释。' }
      ]
    },
    {
      heading: '内景 · 回声科技 · 录音棚 · 夜',
      blocks: [
        { type: 'action', text: '服务关闭前十分钟。录音棚的灯一盏盏熄灭。' },
        { type: 'dialogue', who: '林小满', text: '你最后再学她一次。就说「小满，别哭」。' },
        { type: 'dialogue', who: 'AI 回响', text: '对不起。该账户最后一条完整留言，已解锁。' },
        { type: 'action', text: '屏幕亮起。母亲的脸没有出现，只有一条完整的声纹。' },
        { type: 'dialogue', who: '周岚', paren: '（录音）', text: '小满，妈妈也有过想逃的时候。别替我活。' },
        { type: 'action', text: '小满把手放在删除键上。很久。' },
        { type: 'action', text: '她按了下去。声纹像潮水一样退去。' }
      ]
    },
    {
      heading: '内景 · 小满家 · 清晨',
      blocks: [
        { type: 'action', text: '天亮了。旧手机躺在桌上，电话卡已经被拔掉。' },
        { type: 'action', text: '她拿起另一部手机，翻到父亲的号码，按下拨通。' },
        { type: 'dialogue', who: '父亲', paren: '（电话）', text: '喂？小满？' },
        { type: 'dialogue', who: '林小满', text: '爸，你今天有空吗？' },
        { type: 'dialogue', who: '父亲', text: '有。怎么了？' },
        { type: 'action', text: '她张了张嘴，发现没有准备好的台词。' },
        { type: 'dialogue', who: '林小满', text: '没什么。就是……想跟你说说话。' },
        { type: 'action', text: '窗台上两只旧杯子。一只冒着热气，一只空着。' }
      ]
    }
  ],

  paper: [
    {
      heading: '内景 · 江南小镇 · 纸扎铺 · 夜',
      blocks: [
        { type: 'action', text: '头七夜。白烛烧到一半，纸马、纸屋、纸人在潮湿的空气里发亮。' },
        { type: 'action', text: '阿萤坐在门槛上剪一只纸兔。剪刀一歪，兔耳朵掉了一截。' },
        { type: 'dialogue', who: '阿萤', text: '爸，你头七也这么不省心。' },
        { type: 'action', text: '纸兔忽然抖了抖耳朵。' },
        { type: 'action', text: '穿堂风吹过，父亲灵位前的半句话被吹散。' },
        { type: 'dialogue', who: '纸鹤', paren: '（细声）', text: '阿萤，灯要灭了。' },
        { type: 'action', text: '阿萤抬起头。满屋的纸动物都转向了她。' }
      ]
    },
    {
      heading: '内景 · 纸扎铺后院 · 夜',
      blocks: [
        { type: 'action', text: '纸鹤站在磨盘上，翅膀薄得透光。' },
        { type: 'dialogue', who: '纸鹤', text: '你爹把想说的话，折进了 108 只纸动物里。' },
        { type: 'dialogue', who: '阿萤', text: '108 只？他一天说不了三句话，哪来这么多话？' },
        { type: 'dialogue', who: '纸鹤', text: '说不出口的，才要折起来。' },
        { type: 'action', text: '第一只纸马迈出一步，前腿就软了。金箔簌簌往下掉。' },
        { type: 'dialogue', who: '纸鹤', text: '鸡鸣前送到河边烧掉。每走一步，它们就会掉色。' },
        { type: 'dialogue', who: '阿萤', text: '送不到呢？' },
        { type: 'dialogue', who: '纸鹤', text: '你爹就变成一句没有去处的话。' }
      ]
    },
    {
      heading: '外景 · 雨后石桥 · 夜',
      blocks: [
        { type: 'action', text: '山洪冲断了去河边的路。纸动物们挤在桥头，颜色已经淡了一半。' },
        { type: 'action', text: '纸老虎走到最前面，慢慢把自己摊平。虎皮在水面上展开，成了一条窄桥。' },
        { type: 'dialogue', who: '阿萤', text: '不能踩。这是他最后一件没卖出去的。' },
        { type: 'dialogue', who: '纸虎', paren: '（闷声）', text: '阿萤，桥就是给人走的。' },
        { type: 'action', text: '她抬起脚，又放下。纸虎在雨里笑了一声，很难听。' },
        { type: 'action', text: '她踩了上去。虎皮在她脚下轻轻发抖。' },
        { type: 'dialogue', who: '阿萤', paren: '（小声）', text: '爸，你轻点。' }
      ]
    },
    {
      heading: '外景 · 河边 · 芦苇荡 · 夜',
      blocks: [
        { type: 'action', text: '河滩上，纸动物一只只开口。说的都是父亲日常的责备。' },
        { type: 'dialogue', who: '纸马', paren: '（父亲的声音）', text: '别添乱。' },
        { type: 'dialogue', who: '纸牛', paren: '（父亲的声音）', text: '女孩子家。' },
        { type: 'dialogue', who: '纸羊', paren: '（父亲的声音）', text: '以后你会懂。' },
        { type: 'dialogue', who: '阿萤', paren: '（越来越快）', text: '还有呢？还有呢？他到最后还是这样。' },
        { type: 'action', text: '她抓起纸鹤，撕成两半。' },
        { type: 'action', text: '纸鹤的肚子里掉出一张很小的字条。上面是父亲的字：阿萤不怕。' },
        { type: 'action', text: '她蹲下去捡，手抖得厉害。' }
      ]
    },
    {
      heading: '外景 · 河滩 · 火堆 · 夜',
      blocks: [
        { type: 'action', text: '火堆前只剩最后一只纸马。它的颜色几乎掉光了。' },
        { type: 'dialogue', who: '阿萤', paren: '（吸鼻子）', text: '你最后一句，是不是终于要说爱我了？' },
        { type: 'action', text: '纸马低下头，父亲的声音从纸里传出来，很轻。' },
        { type: 'dialogue', who: '陈守拙', paren: '（纸马里的声音）', text: '别学我。别总替别人活。' },
        { type: 'dialogue', who: '阿萤', paren: '（哭出来）', text: '你凭什么现在才说？' },
        { type: 'action', text: '她把纸马放进火里。火舌卷起纸灰，像一群黑鸟飞向河面。' },
        { type: 'dialogue', who: '阿萤', paren: '（对着火）', text: '我知道了。你走吧。' }
      ]
    },
    {
      heading: '内景 · 纸扎铺 · 清晨',
      blocks: [
        { type: 'action', text: '头七过后，铺门重新打开。阳光照在满桌纸屑上。' },
        { type: 'action', text: '阿萤坐在父亲的位置上，剪一只兔子。剪得歪歪扭扭。' },
        { type: 'action', text: '门外探进来一个小孩的脑袋。' },
        { type: 'dialogue', who: '小孩', text: '姐姐，你会扎会飞的马吗？' },
        { type: 'dialogue', who: '阿萤', text: '会。不过今天先扎一只不会飞的。' },
        { type: 'action', text: '她把兔子放在桌上，退后一步看了看。' },
        { type: 'action', text: '然后她拿起笔，在兔子耳朵上写了自己的名字。' }
      ]
    }
  ],

  radio: [
    {
      heading: '内景 · 城市电台 · 直播间 · 夜',
      blocks: [
        { type: 'action', text: 'ON AIR 红灯亮着。隔音玻璃外空无一人。' },
        { type: 'dialogue', who: '周野', paren: '（对着话筒）', text: '这里是《零点之后》，我是周野。今晚是最后一期。' },
        { type: 'action', text: '控制台忽然跳进一个没有来电显示的号码。他犹豫了一秒，接起。' },
        { type: 'dialogue', who: '来电者', paren: '（变调）', text: '今晚 00:47，你会死。' },
        { type: 'dialogue', who: '周野', paren: '（笑）', text: '这玩笑不好笑。你哪位？' },
        { type: 'action', text: '对方没有回答。耳机里只有呼吸声。' },
        { type: 'action', text: '那呼吸的节奏，和他一模一样。' }
      ]
    },
    {
      heading: '内景 · 直播间 · 导播台 · 连续',
      blocks: [
        { type: 'action', text: '他把来电音频拖进软件。背景里有一段不该存在的新闻播报。' },
        { type: 'dialogue', who: '新闻播报', paren: '（录音）', text: '……本台主持人周野在直播中遇害，警方已介入调查。' },
        { type: 'dialogue', who: '周野', text: '明天的录音？' },
        { type: 'action', text: '手机没有信号。墙上的钟停在 00:31。' },
        { type: 'action', text: '桌上的工作电话响了，是顾青。' },
        { type: 'dialogue', who: '顾青', paren: '（电话）', text: '周野，你那边什么声音？' },
        { type: 'dialogue', who: '周野', text: '顾青，如果我今晚死了，别剪掉这段。' }
      ]
    },
    {
      heading: '内景 · 电台 · 走廊 · 夜',
      blocks: [
        { type: 'action', text: '走廊的应急灯一闪一闪。保安老赵坐在尽头，手里攥着一张纸。' },
        { type: 'dialogue', who: '周野', text: '老赵，你也接到电话了？' },
        { type: 'dialogue', who: '保安老赵', text: '他说我今晚值班。还给了我一张名单。' },
        { type: 'action', text: '纸上只有两个名字。第一个是老赵。第二个是周野。' },
        { type: 'dialogue', who: '周野', text: '谁写的？' },
        { type: 'dialogue', who: '保安老赵', text: '第二个名字……是你自己写的。' },
        { type: 'action', text: '周野低头看自己的手。右手食指上有一道新鲜的墨水痕。' }
      ]
    },
    {
      heading: '内景 · 直播间 · 镜墙 · 00:40',
      blocks: [
        { type: 'action', text: '他戴上耳机。身后传来呼吸声。' },
        { type: 'action', text: '回头。只有镜子。' },
        { type: 'action', text: '镜中的周野比他慢半拍。' },
        { type: 'dialogue', who: '周野', paren: '（盯着镜子）', text: '你是谁？' },
        { type: 'action', text: '镜中的他先张了嘴。声音从耳机里传来。' },
        { type: 'dialogue', who: '镜中周野', paren: '（慢半拍）', text: '我是那个没有关掉直播的人。' },
        { type: 'action', text: '镜面像水面一样起了一圈波纹。' }
      ]
    },
    {
      heading: '内景 · 直播间 · 00:47',
      blocks: [
        { type: 'action', text: '整栋楼停电。备用电源启动。所有屏幕同时亮起。' },
        { type: 'action', text: '控制台自动播放一段画面：周野在镜头前被追杀。' },
        { type: 'dialogue', who: '周野', paren: '（看着屏幕里的自己）', text: '原来这期节目，观众只有我一个。' },
        { type: 'action', text: '他伸手，拔掉直播电源。' },
        { type: 'action', text: '屏幕一块块黑掉。最后只剩镜子里的他还在微笑。' },
        { type: 'dialogue', who: '周野', paren: '（对镜子）', text: '今晚的节目，到此为止。' }
      ]
    },
    {
      heading: '内景 · 城市电台 · 清晨',
      blocks: [
        { type: 'action', text: '天亮。台里的人说，昨晚节目从未播出。' },
        { type: 'action', text: '周野的节目表上，多了一盘标着「明天」的磁带。' },
        { type: 'dialogue', who: '顾青', text: '你昨晚到底播了什么？' },
        { type: 'dialogue', who: '周野', text: '空白。' },
        { type: 'action', text: '他把磁带放进机器。里面只有呼吸声。' },
        { type: 'action', text: '一下，又一下。和他此刻的呼吸完全重合。' },
        { type: 'action', text: '他按下停止键。呼吸声没有停。' }
      ]
    }
  ],

  lost: [
    {
      heading: '内景 · 城市尽头 · 失物招领处 · 黄昏',
      blocks: [
        { type: 'action', text: '上万只牛皮纸盒从门口一直堆到看不见的尽头。灰尘在光里漂浮。' },
        { type: 'action', text: '陈默把最后一只箱子放下，胸口别着新工牌。' },
        { type: 'dialogue', who: '陈默', paren: '（念标签）', text: '勇气。初恋的名字。和父亲和解的下午。' },
        { type: 'action', text: '门口传来拐杖声。周奶奶站在逆光里，没有进来。' },
        { type: 'dialogue', who: '周奶奶', text: '小伙子，我来取个东西。' },
        { type: 'dialogue', who: '陈默', text: '取件单呢？' },
        { type: 'action', text: '一张纸从架子上飘下来，落在他脚边。' },
        { type: 'action', text: '取件单上写着：我的未来。取件人：陈默。' }
      ]
    },
    {
      heading: '内景 · 失物招领处 · 窗口 · 日',
      blocks: [
        { type: 'action', text: '周奶奶把一张三十年前的婚礼请柬放在柜台上。' },
        { type: 'dialogue', who: '周奶奶', text: '我来取我的勇气。' },
        { type: 'dialogue', who: '陈默', text: '您确定是这一件？它看起来……很旧了。' },
        { type: 'dialogue', who: '周奶奶', text: '我就看一眼。那东西应该还亮着吧？' },
        { type: 'action', text: '他打开铁盒。里面是一小团温暖的光。' },
        { type: 'dialogue', who: '陈默', text: '您要拿它去哪儿？' },
        { type: 'dialogue', who: '周奶奶', text: '葬礼。我丈夫的。' },
        { type: 'action', text: '她接过盒子，转身走进阳光。背比来时直了一点。' }
      ]
    },
    {
      heading: '内景 · 失物招领处 · 档案层 · 夜',
      blocks: [
        { type: 'action', text: '陈默翻遍档案层，找不到「未来」的盒子。' },
        { type: 'action', text: '前任管理员留下一张字条：未来不在这里，在你还不敢去的地方。' },
        { type: 'dialogue', who: '陈默', paren: '（对着空架子）', text: '这算什么失物招领处。' },
        { type: 'action', text: '他低头看取件单。上面的字迹，和他十年前的作业本一模一样。' },
        { type: 'action', text: '他忽然想起什么，拿起手电，走向地下库房。' }
      ]
    },
    {
      heading: '内景 · 失物招领处 · 地下库房 · 夜',
      blocks: [
        { type: 'action', text: '库房最深处，一只写着「陈默」的盒子。' },
        { type: 'action', text: '他打开。里面是美院录取通知书，和一支干掉的画笔。' },
        { type: 'dialogue', who: '陈默', paren: '（很久）', text: '我当年不是没考上。我是没去。' },
        { type: 'action', text: '盒底贴着一张价签：认领需支付「一次失败」。' },
        { type: 'dialogue', who: '陈默', text: '我没带钱。' },
        { type: 'action', text: '身后传来周奶奶的声音。' },
        { type: 'dialogue', who: '周奶奶', paren: '（画外）', text: '那你还站在这儿干什么？' }
      ]
    },
    {
      heading: '内景 · 失物招领处 · 门口 · 清晨',
      blocks: [
        { type: 'action', text: '周奶奶把铁盒放回陈默手里。' },
        { type: 'dialogue', who: '周奶奶', text: '我用不上了。你拿去。' },
        { type: 'dialogue', who: '陈默', text: '这不合规矩。' },
        { type: 'dialogue', who: '周奶奶', text: '规矩是给不敢的人定的。' },
        { type: 'action', text: '她走了。陈默打开自己的盒子。' },
        { type: 'action', text: '录取通知书下面，只有一张白纸和一支铅笔。' },
        { type: 'action', text: '他拿起铅笔，用指甲掐了掐笔尖。然后开始削。' }
      ]
    },
    {
      heading: '外景 · 失物招领处 · 门口 · 清晨',
      blocks: [
        { type: 'action', text: '第二天。陈默在门口支起画架。' },
        { type: 'action', text: '一个女孩走过来，手里捧着一团透明的、微微发亮的东西。' },
        { type: 'dialogue', who: '女孩', text: '这个能取吗？我弄丢的夏天。' },
        { type: 'dialogue', who: '陈默', text: '能。先登记。' },
        { type: 'action', text: '他翻开登记簿，写下第一行新记录。' },
        { type: 'action', text: '女孩看着他的画架，问：你画什么？' },
        { type: 'dialogue', who: '陈默', paren: '（想了想）', text: '画一个还没发生的地方。' }
      ]
    }
  ],

  store: [
    {
      heading: '内景 · 24 小时便利店 · 凌晨 03:00',
      blocks: [
        { type: 'action', text: '冷柜的白光把货架照得过分清楚。许放把同一排饭团摆正。' },
        { type: 'action', text: '门铃响。夏遥进来，径直走向关东煮。' },
        { type: 'dialogue', who: '夏遥', text: '一颗茶叶蛋。' },
        { type: 'dialogue', who: '许放', text: '每天一颗，不腻？' },
        { type: 'dialogue', who: '夏遥', text: '明天见。' },
        { type: 'action', text: '她走了。许放看了一眼收银机上的日期。和昨天一样。' },
        { type: 'dialogue', who: '许放', paren: '（低声）', text: '夏遥，明天……是几号？' }
      ]
    },
    {
      heading: '内景 · 便利店 · 货架间 · 凌晨 03:00',
      blocks: [
        { type: 'action', text: '许放试过提前关门、报警、整夜不睡。每次睁眼，还是 03:00。' },
        { type: 'action', text: '夏遥照旧进来，照旧买一颗茶叶蛋，照旧在 03:17 离开。' },
        { type: 'action', text: '只是她每天多买一样东西。今天是一瓶他常喝的汽水。' },
        { type: 'dialogue', who: '许放', text: '你每天多买一样，是喂谁？' },
        { type: 'dialogue', who: '夏遥', paren: '（不看他）', text: '喂一个不长记性的人。' },
        { type: 'action', text: '许放看着那瓶汽水。标签是他大学时最喜欢的牌子。' }
      ]
    },
    {
      heading: '外景 · 便利店对面 · 长椅 · 凌晨 03:20',
      blocks: [
        { type: 'action', text: '许放跟着夏遥出门。她坐在对面长椅上，撑开一把只够一个人的伞。' },
        { type: 'action', text: '她等的人，是五年前的他。' },
        { type: 'dialogue', who: '许放', text: '你也记得？' },
        { type: 'dialogue', who: '夏遥', text: '比你久。久到我快忘了第一次为什么留下。' },
        { type: 'action', text: '雨落在伞面上。许放站到雨里。' },
        { type: 'dialogue', who: '夏遥', text: '别站外面。' },
        { type: 'dialogue', who: '许放', text: '那你往里面一点。' },
        { type: 'action', text: '她往旁边挪了挪。伞还是只够一个人。' }
      ]
    },
    {
      heading: '内景 · 便利店 · 收银台 · 凌晨 03:14',
      blocks: [
        { type: 'action', text: '夏遥把茶叶蛋放在收银台上，没有扫码。' },
        { type: 'dialogue', who: '夏遥', text: '只要你说「别走」，循环就会结束。' },
        { type: 'dialogue', who: '许放', text: '那我会忘了你？' },
        { type: 'dialogue', who: '夏遥', text: '会。所以别说。' },
        { type: 'action', text: '她低头剥蛋壳。壳碎在掌心。' },
        { type: 'dialogue', who: '许放', text: '你为什么不自己说？' },
        { type: 'dialogue', who: '夏遥', paren: '（轻声）', text: '因为我也想看看，你会不会先开口。' }
      ]
    },
    {
      heading: '内景 · 便利店 · 收银台 · 凌晨 03:17',
      blocks: [
        { type: 'action', text: '时钟走到 03:17。许放没有说「别走」。' },
        { type: 'action', text: '夏遥把最后一口茶叶蛋咽下去，站起来。' },
        { type: 'dialogue', who: '夏遥', text: '明天见，许放。' },
        { type: 'action', text: '她第一次叫了他的名字。' },
        { type: 'dialogue', who: '许放', text: '明天见。' },
        { type: 'action', text: '空气里响起一声很轻的裂响，像玻璃。' },
        { type: 'action', text: '货架上的日期，跳了一格。' }
      ]
    },
    {
      heading: '内景 · 便利店 · 清晨 06:00',
      blocks: [
        { type: 'action', text: '第二天。货架上的日期变了。夏遥没有来。' },
        { type: 'action', text: '许放把一颗茶叶蛋放进关东煮，又拿出来。' },
        { type: 'dialogue', who: '许放', paren: '（对着空店）', text: '今天茶叶蛋……卖完了。' },
        { type: 'action', text: '收银台上，一颗温热的茶叶蛋下压着一张便签。' },
        { type: 'action', text: '便签上写着：这次换我等你。' },
        { type: 'action', text: '门外，第一班公交车经过。天亮了。' }
      ]
    }
  ],

  extra: [
    {
      heading: '外景 · 横店 · 民国街片场 · 日',
      blocks: [
        { type: 'action', text: '假血浆沿着石板路流进下水道。马小跃躺在画面中央，演一具尸体。' },
        { type: 'action', text: '副导演走过来，把一张通告塞进他手里。' },
        { type: 'dialogue', who: '副导演', text: '明天，杀手。台词三句。' },
        { type: 'dialogue', who: '马小跃', paren: '（从地上坐起来）', text: '我终于不是尸体了？' },
        { type: 'dialogue', who: '副导演', text: '别高兴太早。剧组没钱，杀手也得自己带盒饭。' },
        { type: 'action', text: '化妆间里，一个穿黑风衣的男人正在等他。' },
        { type: 'dialogue', who: '阿坤', text: '你就是剧组请来的？' },
        { type: 'action', text: '马小跃看着他腰间的道具枪，咽了口口水。' }
      ]
    },
    {
      heading: '外景 · 片场 · 导演监视器旁 · 日',
      blocks: [
        { type: 'action', text: '马小跃没有解释。为了被拖欠的八千块，他决定演到底。' },
        { type: 'dialogue', who: '导演', paren: '（盯着监视器）', text: '这个状态对！就要这种「杀过人」的松弛。' },
        { type: 'dialogue', who: '马小跃', text: '导演，我能不能先结一下……' },
        { type: 'dialogue', who: '导演', text: '加鸡腿。' },
        { type: 'action', text: '全组安静了一秒，然后所有人开始认真对待他的表演。' },
        { type: 'dialogue', who: '小乔', paren: '（递水）', text: '你手在抖。' },
        { type: 'dialogue', who: '马小跃', text: '沉浸式。' }
      ]
    },
    {
      heading: '内景 · 片场 · 仓库 · 夜',
      blocks: [
        { type: 'action', text: '阿坤把那个欠债的群演推到马小跃面前。' },
        { type: 'dialogue', who: '阿坤', text: '处理一下。别留痕迹。' },
        { type: 'action', text: '马小跃看着群演，群演看着他。两个人都在发抖。' },
        { type: 'dialogue', who: '马小跃', paren: '（小声）', text: '兄弟，番茄酱包在左边，记得捏。' },
        { type: 'action', text: '他演了一出假死。血浆喷在墙上，群演倒下的姿势很专业。' },
        { type: 'dialogue', who: '小乔', paren: '（在门口）', text: '你手在抖。' },
        { type: 'dialogue', who: '马小跃', text: '我演尸体的时候不抖。' },
        { type: 'dialogue', who: '小乔', text: '那现在呢？' }
      ]
    },
    {
      heading: '内景 · 片场 · 会议室 · 日',
      blocks: [
        { type: 'action', text: '投资人来看片。阿坤坐在导演旁边，像一尊真正的黑帮。' },
        { type: 'action', text: '马小跃把剧本改成「杀手也有梦想」，声泪俱下地讲戏。' },
        { type: 'dialogue', who: '马小跃', paren: '（入戏）', text: '我杀了很多人。可我只想被一个人记住名字。' },
        { type: 'action', text: '会议室安静了几秒。然后全场鼓掌。' },
        { type: 'action', text: '阿坤第一次被人认真倾听。他低下头，擦了擦眼角。' },
        { type: 'dialogue', who: '阿坤', text: '这个角色，我投。' },
        { type: 'dialogue', who: '马小跃', paren: '（小声）', text: '那我呢？' }
      ]
    },
    {
      heading: '外景 · 片场 · 杀青戏 · 雨夜',
      blocks: [
        { type: 'action', text: '阿坤要求演主角。马小跃换回尸体角色，只要求加一句台词。' },
        { type: 'action', text: '雨机开到最大。他躺在泥水里，等导演喊开始。' },
        { type: 'dialogue', who: '马小跃', paren: '（躺在地上）', text: '其实，我也有名字。' },
        { type: 'action', text: '导演没有喊卡。镜头一直对着他。' },
        { type: 'action', text: '雨水冲掉他脸上的假血。他眨了眨眼。' },
        { type: 'dialogue', who: '小乔', paren: '（画外，轻声）', text: '卡。' }
      ]
    },
    {
      heading: '内景 · 电影院 · 首映 · 夜',
      blocks: [
        { type: 'action', text: '银幕上滚动片尾字幕。马小跃坐在最后一排，身体前倾。' },
        { type: 'action', text: '演员表第七页，出现了「马小跃」。' },
        { type: 'dialogue', who: '小乔', paren: '（小声）', text: '你的名字在第七页。' },
        { type: 'dialogue', who: '马小跃', text: '第七页也是正文。' },
        { type: 'action', text: '银幕的光打在他脸上。他悄悄坐直了一点。' },
        { type: 'action', text: '画面里，他仍然是一具尸体。但这一次，有人看见了他。' }
      ]
    }
  ],

  moon: [
    {
      heading: '外景 · 老城区 · 巷口 · 暴雨夜',
      blocks: [
        { type: 'action', text: '暴雨。积水漫过排水沟。小满蹲在雨里，从水里捧起一枚发烫的月亮。' },
        { type: 'dialogue', who: '小满', text: '你是不是也找不到家了？' },
        { type: 'action', text: '月亮在她掌心亮了一下。' },
        { type: 'action', text: '屋里，父母坐在餐桌两端，离婚协议摊在中间。谁也没有发现她湿透的鞋。' },
        { type: 'dialogue', who: '母亲', paren: '（头也不抬）', text: '小满，先去换鞋。' },
        { type: 'action', text: '小满把月亮藏进书包，站在门口没有动。' },
        { type: 'dialogue', who: '小满', paren: '（很小声）', text: '它只亮给我看。' }
      ]
    },
    {
      heading: '内景 · 小满家 · 客厅 · 夜',
      blocks: [
        { type: 'action', text: '月亮从书包里滚出来，吃掉桌上的米、盐，还有婚纱照里的光。' },
        { type: 'action', text: '窗外，城市一盏一盏熄灯。' },
        { type: 'dialogue', who: '父亲', text: '这玩意儿……是真的？' },
        { type: 'dialogue', who: '小满', text: '它饿了。天亮前得送回去。' },
        { type: 'dialogue', who: '父亲', text: '不然呢？' },
        { type: 'dialogue', who: '小满', text: '城市就永远停在昨天。' },
        { type: 'action', text: '父母对视了一眼。那是今晚他们第一次看对方。' }
      ]
    },
    {
      heading: '内景 · 父亲的出租车 · 雨夜',
      blocks: [
        { type: 'action', text: '出租车在雨里穿行。月亮放在后座，让车里亮起一层柔软的光。' },
        { type: 'action', text: '小满听见一个声音，像从月亮里传出来。' },
        { type: 'dialogue', who: '小满', paren: '（月亮回声）', text: '我以为是我不好，你们才不要我。' },
        { type: 'action', text: '父亲握紧方向盘。雨刷来回刮着。' },
        { type: 'dialogue', who: '父亲', paren: '（很久）', text: '爸不是不要你。爸是怕自己做不好。' },
        { type: 'action', text: '小满把脸转向车窗。玻璃上，月亮和她的倒影叠在一起。' }
      ]
    },
    {
      heading: '外景 · 跨江大桥 · 引桥 · 夜',
      blocks: [
        { type: 'action', text: '暴雨淹没道路。出租车停在桥下。父亲把小满扛上肩。' },
        { type: 'dialogue', who: '小满', text: '你和妈妈是不是再也不好了？' },
        { type: 'action', text: '父亲踩过积水，没有马上回答。' },
        { type: 'dialogue', who: '父亲', text: '是。' },
        { type: 'action', text: '小满趴在他肩上，眼泪掉进他衣领。' },
        { type: 'dialogue', who: '小满', text: '那你还会来接我吗？' },
        { type: 'dialogue', who: '父亲', paren: '（喘着气）', text: '每周三。' },
        { type: 'action', text: '月亮在他怀里，一点一点暗下去。' }
      ]
    },
    {
      heading: '外景 · 跨江大桥 · 桥顶 · 夜',
      blocks: [
        { type: 'action', text: '桥顶。父亲把小满放下来。两个人一起把月亮抛向天空。' },
        { type: 'action', text: '月亮飞起来，又在半空停住，直直掉进江里。' },
        { type: 'dialogue', who: '小满', text: '再来一次。' },
        { type: 'dialogue', who: '父亲', text: '再来。' },
        { type: 'action', text: '第二次。父亲接住月亮，用力抛出去。小满跳起来推了一把。' },
        { type: 'action', text: '月亮升起来。整条江面亮了一下。' },
        { type: 'dialogue', who: '小满', paren: '（喊）', text: '回家吧！' }
      ]
    },
    {
      heading: '外景 · 老城区 · 周三傍晚',
      blocks: [
        { type: 'action', text: '城市恢复。父母还是离婚了。' },
        { type: 'action', text: '周三傍晚，父亲的出租车停在楼下。车里放着一枚小小的月亮夜灯。' },
        { type: 'dialogue', who: '小满', paren: '（上车）', text: '今天月亮上班。' },
        { type: 'dialogue', who: '父亲', text: '那它几点下班？' },
        { type: 'dialogue', who: '小满', text: '我睡着以后。' },
        { type: 'action', text: '父亲笑了一下，发动车子。' },
        { type: 'action', text: '车窗外，那枚小月亮夜灯晃了晃，像在回答。' }
      ]
    }
  ]
};

IDEAS.forEach((idea) => {
  idea.script = SCRIPTS[idea.id] || [];
});
