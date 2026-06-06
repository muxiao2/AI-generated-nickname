export const ELEGANT_CHARS = '云月星雪雨风清浅澜溪岚烟竹松梅兰荷露霜雾棠栀芷瑾瑜宁安然念初晚秋春夏冬南北西东遥知予书墨青白素锦绾辞梦眠听拾鹿鹤鲸鸢萤梨桃杏茶酒弦歌舟川岛屿森沐禾苏若言微尘光影洛汀汐沫澈宛栖棱檀';
export const CUTE_CHARS = '小软甜糯糖桃梨栗橘柚奶兔喵鹿芽豆团圆星泡啾眠暖晴夏果可乐安朵铃米咕嘟乖喜萌绵花露云月';
export const COOL_CHARS = '夜川澈凛寒烬曜珩砚墨玄青屿岚弦渡野序辞尘霁曜临舟隼衡燃寂棠钧辰朔';
export const NEGATIVE_WORDS = ['丑', '笨', '蠢', '傻', '死', '病', '贱', '滚', '烂', '臭', '毒', '赌', '黄', '黑产', '诈骗'];
export const MEME_WORDS = ['杀马特', '非主流', '霸总', 'emo', 'yyds', '绝绝子'];
export const COMMON_USAGE_CHARS = '小月星云清安宁雨风雪白青甜软梦初晚夏秋春桃梨茶墨川鹿森然';
export const PROHIBITED_TERMS = ['国家', '政府', '中央', '网信', '公安', '法院', '检察', '军委', '军队', '警察', '政党', '机关', '新闻', '媒体', '邪教', '迷信', '谣言', '暴力', '恐怖', '犯罪', '赌博', '色情', '淫秽', '民族仇恨', '民族歧视', '颠覆', '分裂', '泄密', '国旗', '国徽', '红十字'];
export const COMPLIANCE_RULES = [
  '不得违反宪法、法律法规，不得危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家统一。',
  '不得损害国家荣誉、公共利益或他人合法权益。',
  '不得煽动民族仇恨、民族歧视，破坏民族团结。',
  '不得破坏国家宗教政策，不得宣扬邪教或封建迷信。',
  '不得散布谣言、扰乱社会秩序、破坏社会稳定。',
  '不得散布淫秽、色情、赌博、暴力、恐怖或教唆犯罪内容。',
  '不得侮辱、诽谤他人，不得包含法律、行政法规禁止的其他内容。',
  '不得假冒、仿冒或捏造政党、政府机关、企事业单位、社会组织、新闻媒体、国家或国际组织名称、标识。'
];
export const STORAGE_KEY = 'hanzi-nickname-studio-v1';
export const AI_PRESETS = {
  OpenAI: { endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  DeepSeek: { endpoint: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' },
};
export const DEFAULT_AI_CONFIG = { provider: 'DeepSeek', ...AI_PRESETS.DeepSeek, apiKey: '' };
export const AI_CRITERIA_PROMPT = `总分100分。读音韵律30分：音节长度8分、声调节奏8分、谐音与歧义14分。视觉排版25分：汉字字形10分、符号字母搭配10分、整体观感5分。意境风格30分：风格统一性10分、内涵与画面感12分、词汇质感8分。场景适配与实用性15分：易记性8分、通用适配性7分。通用扣分：包含低俗、违规、敏感字词总分置0；叠字泛滥或非主流网络用语扣10分；文字、字母、符号强行拼接扣8分。评级：S为90-100，A为80-89，B为70-79，C为60-69，D为0-59。`;
export const FULL_CHINESE_CHARS = Array.from({ length: 0x9fff - 0x4e00 + 1 }, (_, index) => String.fromCharCode(0x4e00 + index)).join('');

export const STYLE_OPTIONS = ['古风', '清冷', '可爱', '综合'];
export const PLACEMENT_OPTIONS = ['任意', '开头', '结尾'];
export const LEVEL_OPTIONS = ['全部', 'S', 'A', 'B', 'C', 'D'];
export const VIEW_OPTIONS = ['候选', '喜欢', '排除'];
export const MODE_OPTIONS = ['本地生成', 'AI生成'];
