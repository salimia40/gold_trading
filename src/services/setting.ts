import { createClient } from "redis";

type Setting = number | string | boolean | null;

type SETTINGS =
  | "BASE_CHARGE"
  | "VIP_OFF"
  | "GIFT_ON_SIGNUP"
  | "GIFT_ON_FIRSTCHARGE"
  | "TARADING_ACTIVATED"
  | "QUOTATION"
  | "COMMITION";

const settingItems: SETTINGS[] = [
  "BASE_CHARGE",
  "VIP_OFF",
  "GIFT_ON_SIGNUP",
  "GIFT_ON_FIRSTCHARGE",
  "TARADING_ACTIVATED",
  "QUOTATION",
  "COMMITION",
];

const settings = {
  "BASE_CHARGE": {
    type: "number",
    default: 1000000,
  },
  "QUOTATION": {
    type: "number",
    default: 10000,
  },
  "COMMITION": {
    type: "number",
    default: 10000,
  },
  "VIP_OFF": {
    type: "number",
    default: 10,
  },
  "GIFT_ON_SIGNUP": {
    type: "boolean",
    default: false,
  },
  "GIFT_ON_FIRSTCHARGE": {
    type: "boolean",
    default: false,
  },
  "TARADING_ACTIVATED": {
    type: "boolean",
    default: false,
  },
};

class Settings {
  private redisClient;

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL,
    });
    this.redisClient.on(
      "error",
      (err) => console.log("Redis Client Error", err),
    );
    this.redisClient.connect().then(() => {
      this.initialize();
    });
  }

  async initialize() {
    let setuped = await this.redisClient.exists("setuped");
    if (!setuped) {
      this.redisClient.set("setuped", "true");
      for (const key of settingItems) {
        // @ts-ignore
        this.redisClient.set(key, String(settings[key]?.default));
      }
    }
  }

  public async get(setting: SETTINGS): Promise<Setting> {
    let s = await this.redisClient.get(setting);
    switch (settings[setting].type) {
      case "boolean":
        return (Boolean(s));
      case "string":
        return String(s);
      case "number":
        return Number(s);
      default:
        return s;
    }
  }

  public async getAll() {
    let s = {};
    for (let key of settingItems) {
      let si = await this.get(key);
      Object.assign(s, { [key]: si });
    }
    return s;
  }

  public async set(setting: SETTINGS, value: Setting) {
    await this.redisClient.set(setting, String(value));
  }
}

export default new Settings();
