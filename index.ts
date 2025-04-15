import {
  ConstantModel, db, definePlugin, Handler, PRIV, Types, param, UserFacingError
} from 'hydrooj';

const coll = db.collection('whitelist_emails');

interface WhitelistEmail {
  _id: string; // 域名部分，比如 example.com
  owner: number; // 添加者ID
  create_at: Date;
}

interface WhitelistEmailWithString extends WhitelistEmail {
  create_at_str: string;
}

declare module 'hydrooj' {
  interface Model {
    whitelist: typeof whitelistModel;
  }
  interface Collections {
    whitelist_emails: WhitelistEmail;
  }
}

// 自己实现简单的邮箱验证函数
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 添加白名单域名
async function add(owner: number, domain: string): Promise<string> {
  const result = await coll.insertOne({
    _id: domain.toLowerCase(),
    owner,
    create_at: new Date(),
  });
  return result.insertedId;
}

// 获取所有白名单域名
async function getAll(): Promise<WhitelistEmailWithString[]> {
  const domains = await coll.find().toArray();
  // 预处理日期格式
  return domains.map((domain) => {
    const date = domain.create_at;
    const dateStr = date ? 
      `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` :
      '未知';
    return {
      ...domain,
      create_at_str: dateStr
    };
  });
}

// 删除白名单域名
async function del(domain: string): Promise<boolean> {
  const result = await coll.deleteOne({ _id: domain.toLowerCase() });
  return result.deletedCount > 0;
}

// 检查邮箱是否在白名单中
async function check(email: string): Promise<boolean> {
  if (!isValidEmail(email)) return false;
  const domain = email.split('@')[1].toLowerCase();
  const count = await coll.countDocuments({ _id: domain });
  return count > 0;
}

const whitelistModel = { add, getAll, del, check };
global.Hydro.model.whitelist = whitelistModel;

// 管理白名单的路由
class WhitelistHandler extends Handler {
  async get() {
    // 检查管理员权限
    this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    const domains = await whitelistModel.getAll();
    this.response.template = 'whitelist_manage.html';
    this.response.body = { domains };
  }

  @param('domain', Types.String)
  async postAdd(domainId: string, domain: string) {
    this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    if (!domain.includes('.')) throw new UserFacingError('无效的域名格式');
    await whitelistModel.add(this.user._id, domain);
    this.back();
  }

  @param('domain', Types.String)
  async postDelete(domainId: string, domain: string) {
    this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    await whitelistModel.del(domain);
    this.back();
  }
}

// 使用export async function apply
export async function apply(ctx) {
  
  // 注册白名单管理路由
  ctx.Route('whitelist_manage', '/manage/whitelist', WhitelistHandler, PRIV.PRIV_EDIT_SYSTEM);
  
  ctx.on('handler/before/UserRegister#post', async (handler) => {
    const mail = handler.args.mail;
    console.log('注册邮箱:', mail); // 添加日志
    if (!mail) throw new UserFacingError('邮箱不能为空');
    
    const isWhitelisted = await whitelistModel.check(mail);
    console.log('白名单检查结果:', isWhitelisted); // 添加日志
    if (!isWhitelisted) {
      throw new UserFacingError('该邮箱域名不在白名单中，无法注册');
    }
  });
} 